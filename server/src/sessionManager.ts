import { WebSocket } from 'ws';
import { ServerMessage } from './types.js';

export interface SessionConfig {
  sessionId: string;
  userId: string;
  stationId: string;
  durationMinutes: number; // default 10 minutes
  ws: WebSocket;
  onExpired: () => void;
}

export class SessionManager {
  private sessionId: string;
  private userId: string;
  private stationId: string;
  private durationMinutes: number;
  private ws: WebSocket;
  private onExpired: () => void;

  private startTime: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private warningTimeout: NodeJS.Timeout | null = null;
  private expirationTimeout: NodeJS.Timeout | null = null;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_LIMIT_MS = 120 * 1000; // 120 seconds of silence auto-disconnect
  private isAlive = true;

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId;
    this.userId = config.userId;
    this.stationId = config.stationId;
    this.durationMinutes = config.durationMinutes;
    this.ws = config.ws;
    this.onExpired = config.onExpired;
    this.startTime = Date.now();

    this.startHeartbeat();
    this.scheduleTimers();
    this.resetInactivityTimer();
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getStationId(): string {
    return this.stationId;
  }

  public getElapsedSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  public markAlive(): void {
    this.isAlive = true;
    this.resetInactivityTimer();
  }

  public markActive(): void {
    this.isAlive = true;
    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    this.inactivityTimeout = setTimeout(() => {
      console.log(`[SessionManager ${this.sessionId}] Inactive for 120s, scaling down to 0`);
      this.send({
        type: 'session_expired',
        reason: 'Session paused due to 2 minutes of inactivity. Reconnect anytime to resume.',
      });
      this.cleanup();
      try {
        this.ws.close(1000, 'Inactive');
      } catch {}
    }, this.INACTIVITY_LIMIT_MS);
  }

  public send(msg: ServerMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (err) {
        console.warn(`[SessionManager ${this.sessionId}] Error sending message:`, err);
      }
    }
  }

  private startHeartbeat(): void {
    // Send ping every 25 seconds to keep Cloud Run WebSocket alive through proxies
    this.heartbeatInterval = setInterval(() => {
      if (!this.isAlive) {
        console.log(`[SessionManager ${this.sessionId}] Client unresponsive, terminating`);
        this.cleanup();
        this.ws.terminate();
        return;
      }

      this.isAlive = false;
      this.send({ type: 'pong' });
    }, 25000);
  }

  private scheduleTimers(): void {
    const totalMs = this.durationMinutes * 60 * 1000;
    const warningMs = Math.max(0, totalMs - 2 * 60 * 1000); // 2 minutes before expiry

    // 2-minute warning
    this.warningTimeout = setTimeout(() => {
      this.send({
        type: 'session_warning',
        minutesRemaining: 2,
        message: 'Two minutes remaining for this OSCE station consultation.',
      });
    }, warningMs);

    // Final expiration at 10 minutes
    this.expirationTimeout = setTimeout(() => {
      this.send({
        type: 'session_expired',
        reason: 'OSCE examination time expired (10 minutes completed).',
      });
      this.onExpired();
      this.cleanup();
    }, totalMs);
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }
}
