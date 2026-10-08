import { GoogleGenAI } from '@google/genai';
import textToSpeech from '@google-cloud/text-to-speech';
import { StationTemplate, Language, AvatarGesture, ServerMessage } from './types.js';

export interface PipelineCallbacks {
  onCandidateTranscript: (text: string, isFinal: boolean) => void;
  onPatientToken: (token: string) => void;
  onAudioChunk: (chunk: {
    chunkIndex: number;
    audioBase64: string;
    mimeType: string;
    isFinal: boolean;
    textSegment: string;
  }) => void;
  onGesture: (gesture: AvatarGesture) => void;
  onRubricScored: (rubricId: string) => void;
  onTurnComplete: (fullText: string, fullTextBurmese?: string, gesture?: AvatarGesture) => void;
  onError: (err: string) => void;
}

export class StreamingVoicePipeline {
  // In-Memory Global Audio Cache: eliminates redundant TTS calls for standard questions
  private static audioCache = new Map<string, string>();

  private genAI: GoogleGenAI | null = null;
  private ttsClient: textToSpeech.TextToSpeechClient | null = null;
  private template: StationTemplate;
  private language: Language;
  private callbacks: PipelineCallbacks;
  private conversationHistory: Array<{ role: 'user' | 'model'; text: string }> = [];

  constructor(
    template: StationTemplate,
    language: Language,
    callbacks: PipelineCallbacks
  ) {
    this.template = template;
    this.language = language;
    this.callbacks = callbacks;

    const apiKey =
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_API_KEY;

    if (apiKey) {
      try {
        this.genAI = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('[StreamingVoicePipeline] GoogleGenAI init warning:', err);
      }
    }

    try {
      this.ttsClient = new textToSpeech.TextToSpeechClient();
    } catch {
      // Will fall back to Google Cloud REST or client browser synthesis
    }
  }

  /**
   * Process a complete or streaming candidate utterance
   */
  async processCandidateText(candidateText: string): Promise<void> {
    const clean = candidateText.trim();
    if (!clean) return;

    this.conversationHistory.push({ role: 'user', text: clean });

    // Try Gemini Flash streaming generation with concurrent TTS chunking
    if (this.genAI) {
      try {
        await this.streamGeminiFlashTurn(clean);
        return;
      } catch (err: any) {
        console.warn('[StreamingVoicePipeline] Gemini Flash stream error, using template triggers:', err);
      }
    }

    // Fallback: Local deterministic template-grounded response
    await this.processDeterministicFallback(clean);
  }

  /**
   * Ultra low-latency Gemini Flash 3.* streaming reasoning with concurrent phrase-level TTS chunking
   */
  private async streamGeminiFlashTurn(candidateText: string): Promise<void> {
    const systemInstruction = this.buildSystemPrompt();
    const prompt = this.buildTurnPrompt(candidateText);

    // Use Gemini 2.5/3.0 Flash for ultra-low latency streaming
    const model = 'gemini-2.5-flash';

    const responseStream = await this.genAI!.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.15,
        maxOutputTokens: 160,
      },
    });

    let fullGeneratedText = '';
    let phraseAccumulator = '';
    let detectedGesture: AvatarGesture = this.template.defaultGesture;
    let chunkIndex = 0;

    for await (const chunk of responseStream) {
      const textChunk = chunk.text || '';
      if (!textChunk) continue;

      fullGeneratedText += textChunk;
      phraseAccumulator += textChunk;

      // Extract and dispatch [GESTURE: ...] tags
      const gestureMatch = fullGeneratedText.match(/\[GESTURE:\s*([a-z_]+)\]/i);
      if (gestureMatch) {
        const g = gestureMatch[1].toLowerCase() as AvatarGesture;
        detectedGesture = g;
        this.callbacks.onGesture(g);
        fullGeneratedText = fullGeneratedText.replace(gestureMatch[0], '');
        phraseAccumulator = phraseAccumulator.replace(gestureMatch[0], '');
      }

      // Extract and dispatch [RUBRIC: ...] tags
      const rubricMatch = fullGeneratedText.match(/\[RUBRIC:\s*([a-zA-Z0-9_\-]+)\]/i);
      if (rubricMatch) {
        this.callbacks.onRubricScored(rubricMatch[1]);
        fullGeneratedText = fullGeneratedText.replace(rubricMatch[0], '');
        phraseAccumulator = phraseAccumulator.replace(rubricMatch[0], '');
      }

      // Emit text token to frontend
      this.callbacks.onPatientToken(textChunk);

      // Check if phraseAccumulator contains a natural speech boundary:
      // Burmese sentence ending '။' or comma '၊' or English punctuation '.' '?' '!' ','
      if (this.hasSpeechBoundary(phraseAccumulator)) {
        const segmentToSynthesize = phraseAccumulator.trim();
        phraseAccumulator = '';

        if (segmentToSynthesize.length > 0) {
          const currentIdx = chunkIndex++;
          this.synthesizeAndStreamAudioChunk(segmentToSynthesize, currentIdx, false);
        }
      }
    }

    // Flush any remaining text in phraseAccumulator
    const remaining = phraseAccumulator.trim();
    if (remaining.length > 0) {
      const currentIdx = chunkIndex++;
      await this.synthesizeAndStreamAudioChunk(remaining, currentIdx, true);
    }

    const cleanFullText = fullGeneratedText.replace(/\[[A-Z]+:[^\]]+\]/g, '').trim();
    this.conversationHistory.push({ role: 'model', text: cleanFullText });

    this.callbacks.onTurnComplete(
      cleanFullText,
      this.language === 'my' ? cleanFullText : undefined,
      detectedGesture
    );
  }

  /**
   * Check if text segment has a natural speech pause boundary
   */
  private hasSpeechBoundary(text: string): boolean {
    if (this.language === 'my') {
      return text.includes('။') || text.includes('၊') || text.length > 60;
    }
    return (
      text.includes('.') ||
      text.includes('?') ||
      text.includes('!') ||
      text.includes(',') ||
      text.length > 70
    );
  }

  /**
   * Synthesize audio chunk and stream over WebSocket immediately
   */
  private async synthesizeAndStreamAudioChunk(
    textSegment: string,
    chunkIndex: number,
    isFinal: boolean
  ): Promise<void> {
    try {
      const audioBase64 = await this.synthesizeSpeechAudio(textSegment);
      if (audioBase64) {
        this.callbacks.onAudioChunk({
          chunkIndex,
          audioBase64,
          mimeType: 'audio/mp3',
          isFinal,
          textSegment,
        });
      }
    } catch (err) {
      console.warn('[StreamingVoicePipeline] TTS chunk synthesis error:', err);
    }
  }

  /**
   * Synthesize speech using Google Cloud TTS or Google Cloud REST API
   */
  private async synthesizeSpeechAudio(text: string): Promise<string | null> {
    const languageCode = this.language === 'my' ? 'my-MM' : 'en-US';
    const voiceName =
      this.language === 'my'
        ? 'my-MM-Standard-A'
        : this.template.gender === 'female'
        ? 'en-US-Journey-F'
        : 'en-US-Journey-D';

    const cacheKey = `${languageCode}:${voiceName}:${text.trim().toLowerCase()}`;
    if (StreamingVoicePipeline.audioCache.has(cacheKey)) {
      return StreamingVoicePipeline.audioCache.get(cacheKey)!;
    }

    const saveAndReturn = (base64Audio: string) => {
      if (StreamingVoicePipeline.audioCache.size > 500) {
        const firstKey = StreamingVoicePipeline.audioCache.keys().next().value;
        if (firstKey) StreamingVoicePipeline.audioCache.delete(firstKey);
      }
      StreamingVoicePipeline.audioCache.set(cacheKey, base64Audio);
      return base64Audio;
    };

    // 1. Try official client library if credentials configured
    if (this.ttsClient) {
      try {
        const [response] = await this.ttsClient.synthesizeSpeech({
          input: { text },
          voice: {
            languageCode,
            name: voiceName,
            ssmlGender: this.template.gender === 'female' ? 'FEMALE' : 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        });

        if (response.audioContent) {
          const base64 = Buffer.from(response.audioContent).toString('base64');
          return saveAndReturn(base64);
        }
      } catch {}
    }

    // 2. Try Google Cloud TTS REST API using GOOGLE_API_KEY
    const apiKey =
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode, name: voiceName },
            audioConfig: { audioEncoding: 'MP3' },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          if (json.audioContent) {
            return saveAndReturn(json.audioContent);
          }
        }
      } catch {}
    }

    return null;
  }

  /**
   * Deterministic template triggers fallback
   */
  private async processDeterministicFallback(candidateText: string): Promise<void> {
    const matched = this.template.scriptTriggers?.find((t) =>
      t.triggers.some((k) => candidateText.toLowerCase().includes(k.toLowerCase()))
    );

    const gesture: AvatarGesture = matched?.gesture || this.template.defaultGesture;
    if (matched?.rubricId) {
      this.callbacks.onRubricScored(matched.rubricId);
    }
    this.callbacks.onGesture(gesture);

    const replyBurmese = matched
      ? matched.response_my
      : `${this.template.chiefComplaint_my || 'နေမကောင်းပါဘူး ဆရာ'}။ ဘာကို ထပ်သိချင်ပါသလဲ?`;
    const replyEnglish = matched
      ? matched.response
      : `${this.template.chiefComplaint}. What else would you like to know, doctor?`;

    const replyText = this.language === 'my' ? replyBurmese : replyEnglish;

    // Stream text in small chunks to simulate live typing
    const words = replyText.split(' ');
    for (const w of words) {
      this.callbacks.onPatientToken(w + ' ');
      await new Promise((r) => setTimeout(r, 40));
    }

    // Synthesize audio
    const audioBase64 = await this.synthesizeSpeechAudio(replyText);
    if (audioBase64) {
      this.callbacks.onAudioChunk({
        chunkIndex: 0,
        audioBase64,
        mimeType: 'audio/mp3',
        isFinal: true,
        textSegment: replyText,
      });
    }

    this.callbacks.onTurnComplete(replyText, replyBurmese, gesture);
  }

  private buildSystemPrompt(): string {
    const t = this.template;

    return `
You are roleplaying as a real patient in an Objective Structured Clinical Examination (OSCE) for medical doctors.
You MUST stay strictly grounded in your clinical script and medical facts. Do NOT hallucinate or adopt facts from other conditions.

PATIENT PROFILE:
- Name: ${t.patientName} (${t.patientName_my})
- Age: ${t.age} years old, Gender: ${t.gender}
- Chief Complaint: ${t.chiefComplaint} / ${t.chiefComplaint_my}
- Setting: ${t.setting}
- Situation: ${t.situation}
- Vitals: BP ${t.vitals.bp}, HR ${t.vitals.hr} bpm, RR ${t.vitals.rr}, SpO2 ${t.vitals.spo2}%, Pain ${t.vitals.painScore}/10
- Working Medical Diagnosis: ${t.modelSummary?.primaryDiagnosis || 'Clinical case'}

RESPONSE RULES:
1. Speak in ${this.language === 'my' ? 'NATURAL BURMESE (မြန်မာစကားစစ်စစ်)' : 'CLEAR ENGLISH'}.
2. Keep responses concise (1 to 3 sentences maximum), realistic, and clinically accurate.
3. You may append a gesture tag at the end, for example: [GESTURE: clutch_chest] or [GESTURE: holding_abdomen] or [GESTURE: wincing] or [GESTURE: nodding].
4. If candidate asks a specific question that satisfies an OSCE rubric criteria, tag it, e.g. [RUBRIC: socrates-site].
5. Never speak like an AI or medical textbook. Speak from the patient's lived emotional experience.
`.trim();
  }

  private buildTurnPrompt(candidateText: string): string {
    let historyContext = '';
    for (const item of this.conversationHistory.slice(-4)) {
      historyContext += `${item.role === 'user' ? 'Doctor' : 'Patient'}: ${item.text}\n`;
    }

    return `
Conversation so far:
${historyContext}

Doctor just said: "${candidateText}"

Respond as ${this.template.patientName} now:
`.trim();
  }
}
