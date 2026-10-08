class MedicalAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play iOS subtle tactile click sound
  public playHapticTap() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play realistic S1-S2 Heart Auscultation
  public playHeartSound(murmur: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // S1 (Lub) - Mitral/Tricuspid closure
      const s1Osc = ctx.createOscillator();
      const s1Gain = ctx.createGain();
      s1Osc.type = 'sine';
      s1Osc.frequency.setValueAtTime(75, now);
      s1Osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      s1Gain.gain.setValueAtTime(0.4, now);
      s1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      s1Osc.connect(s1Gain);
      s1Gain.connect(ctx.destination);
      s1Osc.start(now);
      s1Osc.stop(now + 0.13);

      // Murmur if present (Systolic flow between S1 and S2)
      if (murmur) {
        const bufferSize = ctx.sampleRate * 0.18;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 450;
        filter.Q.value = 3;

        const mGain = ctx.createGain();
        mGain.gain.setValueAtTime(0.12, now + 0.1);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        whiteNoise.connect(filter);
        filter.connect(mGain);
        mGain.connect(ctx.destination);
        whiteNoise.start(now + 0.1);
      }

      // S2 (Dub) - Aortic/Pulmonary closure (shorter, crisper)
      const s2Delay = 0.3;
      const s2Osc = ctx.createOscillator();
      const s2Gain = ctx.createGain();
      s2Osc.type = 'sine';
      s2Osc.frequency.setValueAtTime(95, now + s2Delay);
      s2Osc.frequency.exponentialRampToValueAtTime(55, now + s2Delay + 0.09);
      s2Gain.gain.setValueAtTime(0.35, now + s2Delay);
      s2Gain.gain.exponentialRampToValueAtTime(0.001, now + s2Delay + 0.09);
      s2Osc.connect(s2Gain);
      s2Gain.connect(ctx.destination);
      s2Osc.start(now + s2Delay);
      s2Osc.stop(now + s2Delay + 0.1);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play respiratory breath sounds (vesicular, crackles, wheeze)
  public playRespiratorySound(type: 'lung_vesicular' | 'lung_crackles' | 'lung_wheeze') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const duration = 1.4;

      // Filtered breath noise
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.18;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = type === 'lung_wheeze' ? 600 : 350;

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.01, now);
      breathGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
      breathGain.gain.linearRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(breathGain);
      breathGain.connect(ctx.destination);
      noise.start(now);

      // Add wheeze pitch harmonic
      if (type === 'lung_wheeze') {
        const wheezeOsc = ctx.createOscillator();
        const wheezeGain = ctx.createGain();
        wheezeOsc.type = 'sawtooth';
        wheezeOsc.frequency.setValueAtTime(410, now + 0.4);
        wheezeOsc.frequency.linearRampToValueAtTime(440, now + 0.9);
        wheezeGain.gain.setValueAtTime(0.001, now + 0.4);
        wheezeGain.gain.linearRampToValueAtTime(0.08, now + 0.6);
        wheezeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        wheezeOsc.connect(wheezeGain);
        wheezeGain.connect(ctx.destination);
        wheezeOsc.start(now + 0.4);
        wheezeOsc.stop(now + 1.2);
      }

      // Add crackles (intermittent micro clicks)
      if (type === 'lung_crackles') {
        for (let i = 0; i < 6; i++) {
          const clickTime = now + 0.5 + Math.random() * 0.6;
          const crackleOsc = ctx.createOscillator();
          const crackleGain = ctx.createGain();
          crackleOsc.type = 'triangle';
          crackleOsc.frequency.value = 1800 + Math.random() * 800;
          crackleGain.gain.setValueAtTime(0.12, clickTime);
          crackleGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.015);
          crackleOsc.connect(crackleGain);
          crackleGain.connect(ctx.destination);
          crackleOsc.start(clickTime);
          crackleOsc.stop(clickTime + 0.02);
        }
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // OSCE Bell Chime (Official OSCE 2-min warning & station finish)
  public playOSCEChime(isWarning: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freq = isWarning ? 659.25 : 880.0; // E5 or A5 chime

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);

      if (!isWarning) {
        // Second harmonious tone for station completion
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, now + 0.2); // D6
        gain2.gain.setValueAtTime(0.28, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.2);
        osc2.stop(now + 1.4);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const medicalAudio = new MedicalAudioEngine();
