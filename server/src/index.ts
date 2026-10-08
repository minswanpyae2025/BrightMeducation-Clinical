import http from 'http';
import { parse as parseUrl } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { AuthService } from './auth.js';
import { StreamingVoicePipeline } from './streamingVoicePipeline.js';
import { SessionManager } from './sessionManager.js';
import { ClientMessage, StationTemplate, Language } from './types.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const authService = new AuthService();
const activeSessions = new Map<string, SessionManager>();

// 1. HTTP Server for Health Checks & WebSocket Upgrade
const server = http.createServer((req, res) => {
  const { pathname } = parseUrl(req.url || '', true);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/health' || pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'brightmed-voice-service',
        activeSessions: activeSessions.size,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'Bright Meducation Clinical — Ultra-Low Latency Voice Streaming Engine',
        version: '1.0.0',
        platform: 'Google Cloud Run (Serverless On-Demand)',
        protocols: ['WebSocket (wss://)'],
        endpoint: '/live-osce',
        documentation: 'https://github.com/minswanpyae2025/BrightMeducation-Clinical',
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Security: IP Rate Limiting Map (Max 12 connection attempts per minute per IP)
const ipConnectionMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_CONNS_PER_WINDOW = 12;

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const history = (ipConnectionMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (history.length >= MAX_CONNS_PER_WINDOW) {
    return false;
  }
  history.push(now);
  ipConnectionMap.set(ip, history);
  return true;
}

// 2. WebSocket Server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = parseUrl(request.url || '', true);

  if (pathname === '/live-osce' || pathname === '/ws') {
    // 1. IP Rate Limiting Guard
    const clientIp =
      (request.headers['x-forwarded-for'] as string) ||
      request.socket.remoteAddress ||
      'unknown-ip';

    if (!checkIpRateLimit(clientIp)) {
      console.warn(`[Security] Rate limit exceeded for IP: ${clientIp}`);
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    // 2. Origin Security Guard
    const origin = request.headers.origin;
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;

    if (allowedOriginsEnv && origin) {
      const allowedList = allowedOriginsEnv
        .split(',')
        .map((s) => s.trim().toLowerCase());
      const originLower = origin.toLowerCase();
      const isAllowed =
        allowedList.includes(originLower) ||
        originLower.includes('localhost') ||
        originLower.includes('127.0.0.1');

      if (!isAllowed) {
        console.warn(`[Security] Rejected unauthorized origin: ${origin}`);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (ws: WebSocket, request: http.IncomingMessage) => {
  const parsed = parseUrl(request.url || '', true);
  const queryToken = (parsed.query.token as string) || '';
  const queryStationId = (parsed.query.stationId as string) || 'default-station';
  const queryLang = (parsed.query.lang as Language) || 'my';

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let sessionManager: SessionManager | null = null;
  let pipeline: StreamingVoicePipeline | null = null;
  let isInitialized = false;

  console.log(`[WebSocket] New client connected. Session: ${sessionId}`);

  // Helper to send typed message
  const send = (data: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  // Helper to initialize session
  const initializeSession = async (
    token: string,
    stationId: string,
    lang: Language,
    template: StationTemplate
  ) => {
    // 1. Authenticate & Verify Credits Quota (20 credits per station)
    const authResult = await authService.authenticateAndDeductCredits(token, stationId);

    if (!authResult.success) {
      console.warn(`[WebSocket ${sessionId}] Auth failed:`, authResult.error);
      send({
        type: 'error',
        code: authResult.errorCode || 'AUTH_FAILED',
        message: authResult.error || 'Authentication failed',
      });
      setTimeout(() => ws.close(4402, authResult.error), 200);
      return;
    }

    // 2. Setup Session Manager (10 minutes OSCE timer)
    sessionManager = new SessionManager({
      sessionId,
      userId: authResult.userId || 'user-unknown',
      stationId,
      durationMinutes: 10,
      ws,
      onExpired: () => {
        console.log(`[Session ${sessionId}] 10 minutes completed, closing.`);
        ws.close(1000, 'OSCE duration completed');
      },
    });

    activeSessions.set(sessionId, sessionManager);

    // 3. Setup Ultra Low-Latency Streaming Pipeline
    pipeline = new StreamingVoicePipeline(template, lang, {
      onCandidateTranscript: (text, isFinal) => {
        sessionManager?.send({ type: 'candidate_transcript', text, isFinal });
      },
      onPatientToken: (token) => {
        sessionManager?.send({ type: 'patient_token', token });
      },
      onAudioChunk: (chunk) => {
        sessionManager?.send({
          type: 'audio_chunk',
          chunkIndex: chunk.chunkIndex,
          audioBase64: chunk.audioBase64,
          mimeType: chunk.mimeType,
          isFinal: chunk.isFinal,
          textSegment: chunk.textSegment,
        });
      },
      onGesture: (gesture) => {
        sessionManager?.send({ type: 'gesture', gesture });
      },
      onRubricScored: (rubricId) => {
        sessionManager?.send({ type: 'rubric_scored', rubricId });
      },
      onTurnComplete: (fullText, fullTextBurmese, gesture) => {
        sessionManager?.send({
          type: 'turn_complete',
          fullText,
          fullTextBurmese,
          gesture: gesture || template.defaultGesture,
        });
      },
      onError: (err) => {
        sessionManager?.send({ type: 'error', code: 'PIPELINE_ERROR', message: err });
      },
    });

    isInitialized = true;

    // Send init acknowledgement with authenticated credits
    sessionManager.send({
      type: 'init_ack',
      authenticated: true,
      userId: authResult.userId || '',
      remainingCredits: authResult.credits ?? 80,
      sessionId,
      durationMinutes: 10,
    });

    console.log(`[Session ${sessionId}] Initialized for user ${authResult.userId}. Credits remaining: ${authResult.credits}`);
  };

  // If token and stationId were provided in query string, initiate right away
  if (queryToken) {
    // Wait for template from init message or use default
  }

  // Handle client messages
  ws.on('message', async (raw: Buffer) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      if (msg.type === 'ping') {
        sessionManager?.markAlive();
        send({ type: 'pong' });
        return;
      }

      if (msg.type === 'init') {
        await initializeSession(
          msg.token || queryToken,
          msg.stationId || queryStationId,
          msg.language || queryLang,
          msg.stationTemplate
        );
        return;
      }

      if (!isInitialized || !pipeline) {
        send({
          type: 'error',
          code: 'UNINITIALIZED',
          message: 'Session has not been initialized. Please send init message with station template.',
        });
        return;
      }

      if (msg.type === 'candidate_text') {
        sessionManager?.markActive();
        await pipeline.processCandidateText(msg.text);
        return;
      }

      if (msg.type === 'audio_chunk') {
        sessionManager?.markActive();
        // In streaming audio mode, candidate audio buffer chunk arrives
        // Can be routed to Google Cloud Speech-to-Text streaming recognizer
        return;
      }

      if (msg.type === 'audio_end') {
        sessionManager?.markActive();
        return;
      }
    } catch (err: any) {
      console.warn(`[WebSocket ${sessionId}] Error handling client message:`, err);
      send({ type: 'error', code: 'MALFORMED_MESSAGE', message: err.message });
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected. Session: ${sessionId}`);
    if (sessionManager) {
      sessionManager.cleanup();
      activeSessions.delete(sessionId);
    }
  });

  ws.on('error', (err) => {
    console.warn(`[WebSocket ${sessionId}] Connection error:`, err);
    if (sessionManager) {
      sessionManager.cleanup();
      activeSessions.delete(sessionId);
    }
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`⚡ Bright Meducation Clinical — Voice Streaming Engine Ready`);
  console.log(`⚡ Listening on 0.0.0.0:${PORT}`);
  console.log(`⚡ WebSocket endpoint: ws://0.0.0.0:${PORT}/live-osce`);
  console.log(`⚡ Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`================================================================`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log('\nShutting down voice streaming service...');
  for (const session of activeSessions.values()) {
    session.cleanup();
  }
  server.close(() => {
    console.log('HTTP/WebSocket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
