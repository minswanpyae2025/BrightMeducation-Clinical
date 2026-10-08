import { AvatarGesture, Language, OSCECase } from '../types';

export interface StreamingClientEvents {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  onCandidateTranscript?: (text: string, isFinal: boolean) => void;
  onPatientToken?: (token: string) => void;
  onPatientSpeakingStart?: () => void;
  onPatientSpeakingEnd?: () => void;
  onGesture?: (gesture: AvatarGesture) => void;
  onRubricScored?: (rubricId: string) => void;
  onTurnComplete?: (fullText: string, fullTextBurmese?: string, gesture?: AvatarGesture) => void;
  onSessionWarning?: (message: string, minutesRemaining: number) => void;
  onSessionExpired?: (reason: string) => void;
  onError?: (err: string) => void;
}

export class StreamingVoiceClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private currentCase: OSCECase;
  private language: Language;
  private events: StreamingClientEvents;
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  // Web Audio API playback queue
  private audioCtx: AudioContext | null = null;
  private audioQueue: Array<{ buffer: AudioBuffer; index: number }> = [];
  private isPlayingQueue = false;
  private nextPlayTime = 0;
  private pingInterval: number | null = null;

  constructor(
    url: string,
    token: string,
    currentCase: OSCECase,
    language: Language,
    events: StreamingClientEvents
  ) {
    this.url = url;
    this.token = token;
    this.currentCase = currentCase;
    this.language = language;
    this.events = events;
  }

  public getStatus() {
    return this.status;
  }

  public isConnected() {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  public updateCaseAndLanguage(currentCase: OSCECase, language: Language) {
    this.currentCase = currentCase;
    this.language = language;
  }

  /**
   * Connect to Google Cloud Run WebSocket streaming service
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      this.setStatus('connecting');

      try {
        const fullUrl = `${this.url}${this.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(
          this.token
        )}&stationId=${encodeURIComponent(this.currentCase.id)}&lang=${this.language}`;

        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          this.setStatus('connected');
          this.startPing();

          // Send init handshake message with grounded station template
          this.send({
            type: 'init',
            token: this.token,
            stationId: this.currentCase.id,
            language: this.language,
            stationTemplate: {
              stationId: this.currentCase.id,
              mainCategory: this.currentCase.mainCategory,
              subCategory: this.currentCase.subCategory,
              title: this.currentCase.title,
              title_my: this.currentCase.title_my,
              patientName: this.currentCase.patient.name,
              patientName_my: this.currentCase.patient.name_my,
              age: this.currentCase.patient.age,
              gender: this.currentCase.patient.gender,
              occupation: this.currentCase.patient.occupation,
              appearance: this.currentCase.patient.appearance,
              chiefComplaint: this.currentCase.patient.chiefComplaint,
              chiefComplaint_my: this.currentCase.patient.chiefComplaint_my,
              defaultGesture: this.currentCase.patient.defaultGesture,
              setting: this.currentCase.candidateBrief.setting,
              situation: this.currentCase.candidateBrief.situation,
              triageNote: this.currentCase.candidateBrief.triageNote,
              vitals: this.currentCase.vitals,
              scriptTriggers: this.currentCase.scriptTriggers || [],
              modelSummary: this.currentCase.modelSummary,
            },
          });

          resolve(true);
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            await this.handleServerMessage(data);
          } catch (err) {
            console.warn('[StreamingVoiceClient] Message error:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[StreamingVoiceClient] WebSocket error:', err);
          this.setStatus('error');
          this.events.onError?.('Streaming connection error');
          resolve(false);
        };

        this.ws.onclose = (event) => {
          this.stopPing();
          this.setStatus('disconnected');
          if (event.code === 4402) {
            this.events.onError?.('Insufficient credits. 20 credits required.');
          }
        };
      } catch (err: any) {
        this.setStatus('error');
        this.events.onError?.(err.message || 'Failed to connect');
        resolve(false);
      }
    });
  }

  public disconnect() {
    this.stopPing();
    this.stopAudioPlayback();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Send candidate text to streaming voice brain
   */
  public sendCandidateText(text: string) {
    if (!this.isConnected()) return false;
    this.send({
      type: 'candidate_text',
      text: text.trim(),
    });
    return true;
  }

  /**
   * Send candidate audio buffer chunk to streaming STT recognizer
   */
  public sendAudioChunk(audioBase64: string, mimeType = 'audio/webm') {
    if (!this.isConnected()) return false;
    this.send({
      type: 'audio_chunk',
      audioBase64,
      mimeType,
    });
    return true;
  }

  private send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  private setStatus(newStatus: 'disconnected' | 'connecting' | 'connected' | 'error') {
    this.status = newStatus;
    this.events.onStatusChange?.(newStatus);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, 20000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle parsed messages from Google Cloud Run service
   */
  private async handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'init_ack':
        console.log(`[StreamingVoiceClient] Connected session ${msg.sessionId}. Credits: ${msg.remainingCredits}`);
        break;

      case 'candidate_transcript':
        this.events.onCandidateTranscript?.(msg.text, msg.isFinal);
        break;

      case 'patient_token':
        this.events.onPatientToken?.(msg.token);
        break;

      case 'audio_chunk':
        if (msg.audioBase64) {
          await this.queueAudioChunk(msg.audioBase64, msg.chunkIndex);
        }
        break;

      case 'gesture':
        this.events.onGesture?.(msg.gesture);
        break;

      case 'rubric_scored':
        this.events.onRubricScored?.(msg.rubricId);
        break;

      case 'turn_complete':
        this.events.onTurnComplete?.(msg.fullText, msg.fullTextBurmese, msg.gesture);
        break;

      case 'session_warning':
        this.events.onSessionWarning?.(msg.message, msg.minutesRemaining);
        break;

      case 'session_expired':
        this.events.onSessionExpired?.(msg.reason);
        break;

      case 'error':
        this.events.onError?.(msg.message);
        break;
    }
  }

  /**
   * Web Audio API: Decode and queue streaming audio chunks for gapless ultra-low latency playback
   */
  private async queueAudioChunk(base64Data: string, chunkIndex: number) {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode audio chunk
      const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));

      this.audioQueue.push({ buffer: audioBuffer, index: chunkIndex });

      if (!this.isPlayingQueue) {
        this.playAudioQueue();
      }
    } catch (err) {
      console.warn('[StreamingVoiceClient] Error decoding audio chunk:', err);
    }
  }

  private playAudioQueue() {
    if (!this.audioCtx || this.audioQueue.length === 0) {
      this.isPlayingQueue = false;
      this.events.onPatientSpeakingEnd?.();
      return;
    }

    this.isPlayingQueue = true;
    this.events.onPatientSpeakingStart?.();

    const item = this.audioQueue.shift()!;
    const source = this.audioCtx.createBufferSource();
    source.buffer = item.buffer;
    source.connect(this.audioCtx.destination);

    const currentTime = this.audioCtx.currentTime;
    const startTime = Math.max(currentTime, this.nextPlayTime);
    source.start(startTime);

    this.nextPlayTime = startTime + item.buffer.duration;

    source.onended = () => {
      if (this.audioQueue.length > 0) {
        this.playAudioQueue();
      } else {
        this.isPlayingQueue = false;
        this.events.onPatientSpeakingEnd?.();
      }
    };
  }

  private stopAudioPlayback() {
    this.audioQueue = [];
    this.isPlayingQueue = false;
    this.nextPlayTime = 0;
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}
