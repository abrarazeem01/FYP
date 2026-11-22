/**
 * NEXUS SENTINEL // ZERO-DEPENDENCY SYNTHETIC WEB AUDIO ENGINE
 * Generates cinematic post-login crystal collisions, vault door rumbles,
 * and tactile UI clicks purely through Web Audio API oscillators and filters.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const savedMute = localStorage.getItem('nexus_audio_muted');
      this.isMuted = savedMute === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('nexus_audio_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('nexus_audio_muted', String(this.isMuted));
    } catch {}
  }

  /**
   * Post-Login Crystal Impact & Crystalline Resonance Chime
   * Layered high-Q sine/triangle oscillators with glass-like shimmer and long reverb decay tail.
   */
  public playCrystalImpact(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.38, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    masterGain.connect(ctx.destination);

    // Harmonic frequencies for crystalline chord: C6, E6, G6, B6, C7
    const frequencies = [1046.5, 1318.5, 1567.98, 1975.53, 2093.0];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Subtle shimmer vibrato
      osc.frequency.exponentialRampToValueAtTime(freq * 1.008, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.6);

      const decayTime = 1.2 + idx * 0.22;
      gain.gain.setValueAtTime(0.25 / frequencies.length, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decayTime + 0.1);
    });

    // Glass high-frequency spark transient (noise burst)
    try {
      const bufferSize = ctx.sampleRate * 0.05; // 50ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.1);
    } catch {}
  }

  /**
   * Cinematic Heavy Vault Door Opening Rumble
   * Sub-bass oscillator sweep 110Hz -> 32Hz + low-pass pneumatic air-release whoosh.
   */
  public playVaultDoorRumble(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Deep Sub-Bass Rumble Sweep (110Hz -> 32Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.8);

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, now);
    subFilter.frequency.exponentialRampToValueAtTime(45, now + 2.0);
    subFilter.Q.setValueAtTime(5, now);

    subGain.gain.setValueAtTime(0.42, now);
    subGain.gain.linearRampToValueAtTime(0.5, now + 0.4);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 2.5);

    // 2. Pneumatic Air-Release Whoosh (Filtered noise burst)
    try {
      const noiseDuration = 1.4;
      const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(800, now + 0.1);
      bandpass.frequency.exponentialRampToValueAtTime(180, now + 1.2);
      bandpass.Q.setValueAtTime(2.5, now);

      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.001, now);
      airGain.gain.linearRampToValueAtTime(0.22, now + 0.15);
      airGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      noise.connect(bandpass);
      bandpass.connect(airGain);
      airGain.connect(ctx.destination);

      noise.start(now + 0.05);
      noise.stop(now + 1.5);
    } catch {}
  }

  /**
   * Tactile Low-Volume Glass Click for Buttons & Micro-Interactions
   */
  public playTactileClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.025);

    gain.gain.setValueAtTime(0.06, now); // ultra-subtle
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Subtle Acoustic Cord "Tug" Tension Sound for the Rope Theme Switcher
   */
  public playRopeTug(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.045);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const soundEngine = new SoundEngine();
