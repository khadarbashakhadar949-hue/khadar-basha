/**
 * Procedural Web Audio API Sound Synthesizer
 * Zero external audio files or 404 dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Engine synthesizers
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire screech synthesizer
  private screechGain: GainNode | null = null;
  private screechOsc: OscillatorNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;

  // Wash sound generator
  private washNoiseNode: AudioBufferSourceNode | null = null;
  private washGain: GainNode | null = null;

  private userInteracted: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.6;
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.setupScreechNode();
    } catch {
      // Audio not permitted yet or not supported
    }
  }

  public ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.userInteracted = true;
  }

  public setVolumes(master: number, engine: number, sfx: number, muted: boolean) {
    this.isMuted = muted;
    if (!this.masterGain || !this.engineGain || !this.sfxGain || !this.ctx) return;

    const t = this.ctx.currentTime;
    const effectiveMaster = muted ? 0.0001 : Math.max(0.0001, master);
    this.masterGain.gain.setTargetAtTime(effectiveMaster, t, 0.05);
    this.engineGain.gain.setTargetAtTime(Math.max(0.0001, engine * 0.7), t, 0.05);
    this.sfxGain.gain.setTargetAtTime(Math.max(0.0001, sfx * 0.8), t, 0.05);
  }

  // ===================== ENGINE SYNTHESIS =====================
  public startEngine(category: 'truck' | 'car' | 'motorcycle') {
    this.ensureContext();
    if (!this.ctx || !this.engineGain || this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;
      // Dual oscillator engine model: sub-rumble + harmonic growl
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();

      let baseFreq = 55;
      let osc1Type: OscillatorType = 'sawtooth';
      let osc2Type: OscillatorType = 'triangle';

      if (category === 'truck') {
        baseFreq = 38; // deep diesel chug
        osc1Type = 'sawtooth';
        osc2Type = 'square';
      } else if (category === 'motorcycle') {
        baseFreq = 95; // high-rev whine
        osc1Type = 'sawtooth';
        osc2Type = 'sawtooth';
      } else {
        baseFreq = 62; // tuned V8/V10 rumble
        osc1Type = 'sawtooth';
        osc2Type = 'triangle';
      }

      this.engineOsc1.type = osc1Type;
      this.engineOsc1.frequency.setValueAtTime(baseFreq, now);

      this.engineOsc2.type = osc2Type;
      this.engineOsc2.frequency.setValueAtTime(baseFreq * 1.5, now);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(baseFreq * 6, now);
      this.engineFilter.Q.setValueAtTime(3.0, now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.35, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(oscGain);
      oscGain.connect(this.engineGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio node error handling
    }
  }

  public updateEngine(rpmRatio: number, throttle: number, speedRatio: number, category: 'truck' | 'car' | 'motorcycle') {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const t = this.ctx.currentTime;
    let baseFreq = 50;
    let maxFreq = 260;

    if (category === 'truck') {
      baseFreq = 36;
      maxFreq = 160;
    } else if (category === 'motorcycle') {
      baseFreq = 90;
      maxFreq = 420;
    } else {
      baseFreq = 55;
      maxFreq = 320;
    }

    const targetFreq = baseFreq + (maxFreq - baseFreq) * (rpmRatio * 0.75 + throttle * 0.25);
    const filterFreq = Math.min(6000, targetFreq * (4 + throttle * 3));

    this.engineOsc1.frequency.setTargetAtTime(targetFreq, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.498, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.08);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
      this.engineFilter?.disconnect();
    } catch {}
    this.isEngineRunning = false;
  }

  // ===================== TIRE DRIFT / SCREECH =====================
  private setupScreechNode() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.value = 0.0001;

      this.screechOsc = this.ctx.createOscillator();
      this.screechOsc.type = 'sawtooth';
      this.screechOsc.frequency.value = 750;

      this.screechFilter = this.ctx.createBiquadFilter();
      this.screechFilter.type = 'bandpass';
      this.screechFilter.frequency.value = 1100;
      this.screechFilter.Q.value = 4.0;

      this.screechOsc.connect(this.screechFilter);
      this.screechFilter.connect(this.screechGain);
      this.screechGain.connect(this.sfxGain);

      this.screechOsc.start();
    } catch {}
  }

  public updateScreech(intensity: number) {
    if (!this.ctx || !this.screechGain || !this.screechFilter) return;
    const t = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetGain = clamped > 0.1 ? clamped * 0.28 : 0.0001;
    this.screechGain.gain.setTargetAtTime(targetGain, t, 0.04);
    this.screechFilter.frequency.setTargetAtTime(900 + clamped * 400, t, 0.05);
  }

  // ===================== SFX PROCEDURAL EVENTS =====================
  public playBump(intensity: number = 0.5) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);

      const amp = Math.min(0.4, intensity * 0.35);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  public playCoin() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [987.77, 1318.51, 1975.53]; // B5, E6, B6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.2);
      });
    } catch {}
  }

  public playNitro() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  public playCargoRattle() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  public playNearMiss() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  public playCarWashSound(durationSec: number = 2.0) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      // Procedural white noise burst filtered like high-pressure water jet
      const bufferSize = this.ctx.sampleRate * durationSec;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime + durationSec - 0.3);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + durationSec);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch {}
  }

  public playShineChime() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
