// Real-Time Web Audio API Guitar Amp, Distortion, Fuzz, Delay, Chorus & Reverb Processor
// Implements IGuitarEffectsProcessor (SRP, OCP, LSP, DIP)

import type { IGuitarEffectsProcessor } from '../../domain/contracts';
import type { DriveMode, GuitarFxConfig } from '../../domain/models';

export interface GuitarFxPreset {
  id: string;
  name: string;
  description: string;
  config: Omit<GuitarFxConfig, 'presetId'>;
}

export interface MidiInstrumentOption {
  program: number;
  label: string;
  category: 'Guitarra' | 'Violão' | 'Baixo' | 'Synth / Outros';
}

export const GUITAR_MIDI_PROGRAMS: MidiInstrumentOption[] = [
  { program: 30, label: '🎸 Guitarra Distortion (High-Gain)', category: 'Guitarra' },
  { program: 29, label: '🔥 Guitarra Overdrive (Crunch)', category: 'Guitarra' },
  { program: 80, label: '⚡ Guitarra Fuzz (Square Wave)', category: 'Guitarra' },
  { program: 81, label: '🎛️ Guitarra Fuzz Saw (Sustained)', category: 'Guitarra' },
  { program: 27, label: '✨ Guitarra Clean (Stratocaster)', category: 'Guitarra' },
  { program: 26, label: '🎷 Guitarra Jazz (Warm Humbucker)', category: 'Guitarra' },
  { program: 28, label: '🔇 Guitarra Palm Mute', category: 'Guitarra' },
  { program: 31, label: '🔔 Guitarra Harmônicos', category: 'Guitarra' },
  { program: 25, label: '🪕 Violão Aço (Acoustic Steel)', category: 'Violão' },
  { program: 24, label: '🎼 Violão Nylon (Clássico)', category: 'Violão' },
  { program: 33, label: '🎸 Contrabaixo Fingered (Dedilhado)', category: 'Baixo' },
  { program: 34, label: '🎸 Contrabaixo Picked (Palheta / Rock)', category: 'Baixo' },
  { program: 36, label: '🎸 Contrabaixo Slap', category: 'Baixo' },
  { program: 38, label: '⚡ Contrabaixo Fuzz / Synth Bass', category: 'Baixo' },
  { program: 35, label: '🎸 Contrabaixo Fretless', category: 'Baixo' },
  { program: 32, label: '🎻 Baixo Acústico', category: 'Baixo' },
];

export const GUITAR_FX_PRESETS: GuitarFxPreset[] = [
  {
    id: 'bypass',
    name: 'Bypass (Som Original)',
    description: 'Sem processamento extra de pedaleira — áudio MIDI direto.',
    config: {
      enabled: false,
      driveMode: 'clean',
      driveAmount: 0,
      cabSimEnabled: false,
      bassDb: 0,
      midDb: 0,
      trebleDb: 0,
      chorusMix: 0,
      delayMix: 0,
      delayTimeSec: 0.32,
      delayFeedback: 0.3,
      reverbMix: 0,
    },
  },
  {
    id: 'studio-warmth',
    name: 'Estúdio Realista (Amp + Room)',
    description: 'Adiciona corpo de amplificador valvulado leve, gabinete 4x12 e ambiência de estúdio.',
    config: {
      enabled: true,
      driveMode: 'overdrive',
      driveAmount: 0.22,
      cabSimEnabled: true,
      bassDb: 2,
      midDb: 1.5,
      trebleDb: 1,
      chorusMix: 0.08,
      delayMix: 0.12,
      delayTimeSec: 0.28,
      delayFeedback: 0.22,
      reverbMix: 0.24,
    },
  },
  {
    id: 'british-crunch',
    name: 'Rock Crunch (Overdrive + Cab)',
    description: 'Saturação clássica estilo Marshall JCM800 para AC/DC, Guns N’ Roses e Classic Rock.',
    config: {
      enabled: true,
      driveMode: 'overdrive',
      driveAmount: 0.58,
      cabSimEnabled: true,
      bassDb: 3,
      midDb: 3.5,
      trebleDb: 2.5,
      chorusMix: 0,
      delayMix: 0.14,
      delayTimeSec: 0.3,
      delayFeedback: 0.25,
      reverbMix: 0.2,
    },
  },
  {
    id: 'high-gain-distortion',
    name: 'Heavy Distortion (Metal / Hard Rock)',
    description: 'Distorção pesada e definida com graves firmes e gabinete 4x12 para Metallica, Iron Maiden e Avenged.',
    config: {
      enabled: true,
      driveMode: 'distortion',
      driveAmount: 0.76,
      cabSimEnabled: true,
      bassDb: 4.5,
      midDb: -1.5,
      trebleDb: 3.5,
      chorusMix: 0,
      delayMix: 0.1,
      delayTimeSec: 0.26,
      delayFeedback: 0.2,
      reverbMix: 0.18,
    },
  },
  {
    id: 'vintage-fuzz',
    name: 'Vintage Fuzz (Big Muff / Stoner)',
    description: 'Fuzz rasgado com harmônicos intensos e sustain prolongado (estilo Hendrix, Muse, Arctic Monkeys, QOTSA).',
    config: {
      enabled: true,
      driveMode: 'fuzz',
      driveAmount: 0.85,
      cabSimEnabled: true,
      bassDb: 5,
      midDb: 2,
      trebleDb: 1.5,
      chorusMix: 0.1,
      delayMix: 0.22,
      delayTimeSec: 0.35,
      delayFeedback: 0.32,
      reverbMix: 0.25,
    },
  },
  {
    id: 'solo-lead-delay',
    name: 'Solo Lead (Distortion + Delay + Reverb)',
    description: 'Timbre de solo com distorção cremosa, Delay espacial com repetições quentes e Hall Reverb.',
    config: {
      enabled: true,
      driveMode: 'distortion',
      driveAmount: 0.68,
      cabSimEnabled: true,
      bassDb: 2,
      midDb: 4,
      trebleDb: 3,
      chorusMix: 0.18,
      delayMix: 0.42,
      delayTimeSec: 0.38,
      delayFeedback: 0.45,
      reverbMix: 0.36,
    },
  },
  {
    id: 'clean-chorus-delay',
    name: 'Clean 80s (Chorus + Delay + Reverb)',
    description: 'Som limpo cristalino com Chorus estéreo exuberante, eco rítmico e Reverb amplo.',
    config: {
      enabled: true,
      driveMode: 'clean',
      driveAmount: 0.05,
      cabSimEnabled: false,
      bassDb: 1.5,
      midDb: 0,
      trebleDb: 3,
      chorusMix: 0.48,
      delayMix: 0.35,
      delayTimeSec: 0.36,
      delayFeedback: 0.38,
      reverbMix: 0.35,
    },
  },
];

export const DEFAULT_GUITAR_FX_CONFIG: GuitarFxConfig = {
  presetId: 'studio-warmth',
  ...GUITAR_FX_PRESETS[1].config,
};

export class WebAudioGuitarEffectsRack implements IGuitarEffectsProcessor {
  private ctx: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private dryBypassGain: GainNode | null = null;
  private wetChainInputGain: GainNode | null = null;

  // Drive & Cab Sim nodes
  private preTightFilter: BiquadFilterNode | null = null;
  private preDriveGain: GainNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private postDriveGain: GainNode | null = null;
  private cabHighPass: BiquadFilterNode | null = null;
  private cabLowPass: BiquadFilterNode | null = null;

  // 3-Band EQ nodes
  private eqBass: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqTreble: BiquadFilterNode | null = null;

  // Chorus nodes
  private chorusWetGain: GainNode | null = null;

  // Delay (Echo) nodes
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Reverb nodes
  private reverbWetGain: GainNode | null = null;

  private currentConfig: GuitarFxConfig = { ...DEFAULT_GUITAR_FX_CONFIG };
  private patchedContexts = new WeakSet<AudioContext>();

  getConfig(): GuitarFxConfig {
    return { ...this.currentConfig };
  }

  attachToAudioContext(ctx: AudioContext, activeNode?: AudioNode | null): void {
    if (this.patchedContexts.has(ctx)) {
      this.applyConfig(this.currentConfig);
      return;
    }

    const realDestination = ctx.destination;
    this.ctx = ctx;

    // 1. Master Input & Dry/Wet Bypass Router
    const inputNode = ctx.createGain();
    const dryBypassGain = ctx.createGain();
    const wetChainInputGain = ctx.createGain();
    const masterLimiter = ctx.createDynamicsCompressor();
    masterLimiter.threshold.value = -3.0;
    masterLimiter.knee.value = 6.0;
    masterLimiter.ratio.value = 8.0;
    masterLimiter.attack.value = 0.003;
    masterLimiter.release.value = 0.15;

    inputNode.connect(dryBypassGain);
    dryBypassGain.connect(realDestination);

    inputNode.connect(wetChainInputGain);

    // 2. Pre-Drive Tightening Filter & WaveShaper (Overdrive / Distortion / Fuzz)
    const preTightFilter = ctx.createBiquadFilter();
    preTightFilter.type = 'highpass';
    preTightFilter.frequency.value = 95;

    const preDriveGain = ctx.createGain();
    const waveShaper = ctx.createWaveShaper();
    waveShaper.oversample = '4x';
    const postDriveGain = ctx.createGain();

    // 3. 4x12 Speaker Cabinet Simulator Filters
    const cabHighPass = ctx.createBiquadFilter();
    cabHighPass.type = 'highpass';
    cabHighPass.frequency.value = 75;

    const cabLowPass = ctx.createBiquadFilter();
    cabLowPass.type = 'lowpass';
    cabLowPass.frequency.value = 4600;
    cabLowPass.Q.value = 0.85;

    // 4. 3-Band Amp Tone Stack (Bass, Mid, Treble)
    const eqBass = ctx.createBiquadFilter();
    eqBass.type = 'lowshelf';
    eqBass.frequency.value = 120;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 900;
    eqMid.Q.value = 1.0;

    const eqTreble = ctx.createBiquadFilter();
    eqTreble.type = 'highshelf';
    eqTreble.frequency.value = 3200;

    // Connect core amp serial path: wetChainInput -> preTight -> preDrive -> waveShaper -> postDrive -> Cab -> EQ
    wetChainInputGain.connect(preTightFilter);
    preTightFilter.connect(preDriveGain);
    preDriveGain.connect(waveShaper);
    waveShaper.connect(postDriveGain);
    postDriveGain.connect(cabHighPass);
    cabHighPass.connect(cabLowPass);
    cabLowPass.connect(eqBass);
    eqBass.connect(eqMid);
    eqMid.connect(eqTreble);

    // Core amp signal goes to masterLimiter
    eqTreble.connect(masterLimiter);

    // 5. Parallel Chorus Send from eqTreble
    const chorusDelay = ctx.createDelay(0.05);
    chorusDelay.delayTime.value = 0.016;
    const chorusLfo = ctx.createOscillator();
    chorusLfo.type = 'sine';
    chorusLfo.frequency.value = 1.35;
    const chorusLfoDepth = ctx.createGain();
    chorusLfoDepth.gain.value = 0.0028;
    const chorusWetGain = ctx.createGain();

    chorusLfo.connect(chorusLfoDepth);
    chorusLfoDepth.connect(chorusDelay.delayTime);
    chorusLfo.start();

    eqTreble.connect(chorusDelay);
    chorusDelay.connect(chorusWetGain);
    chorusWetGain.connect(masterLimiter);

    // 6. Parallel Delay (Echo) Send with Warm Tape Feedback Loop
    const delayNode = ctx.createDelay(1.5);
    const delayFeedbackGain = ctx.createGain();
    const delayToneFilter = ctx.createBiquadFilter();
    delayToneFilter.type = 'lowpass';
    delayToneFilter.frequency.value = 2600;
    const delayWetGain = ctx.createGain();

    eqTreble.connect(delayNode);
    delayNode.connect(delayToneFilter);
    delayToneFilter.connect(delayFeedbackGain);
    delayFeedbackGain.connect(delayNode); // Feedback loop
    delayToneFilter.connect(delayWetGain);
    delayWetGain.connect(masterLimiter);

    // 7. Parallel Studio Hall Reverb Send
    const reverbConvolver = ctx.createConvolver();
    reverbConvolver.buffer = this.createStudioImpulseResponse(ctx, 1.85, 2.4);
    const reverbWetGain = ctx.createGain();

    eqTreble.connect(reverbConvolver);
    reverbConvolver.connect(reverbWetGain);
    reverbWetGain.connect(masterLimiter);

    // Final output to real destination
    masterLimiter.connect(realDestination);

    // Store node references
    this.inputNode = inputNode;
    this.dryBypassGain = dryBypassGain;
    this.wetChainInputGain = wetChainInputGain;
    this.preTightFilter = preTightFilter;
    this.preDriveGain = preDriveGain;
    this.waveShaper = waveShaper;
    this.postDriveGain = postDriveGain;
    this.cabHighPass = cabHighPass;
    this.cabLowPass = cabLowPass;
    this.eqBass = eqBass;
    this.eqMid = eqMid;
    this.eqTreble = eqTreble;
    this.chorusWetGain = chorusWetGain;
    this.delayNode = delayNode;
    this.delayFeedbackGain = delayFeedbackGain;
    this.delayWetGain = delayWetGain;
    this.reverbWetGain = reverbWetGain;

    // Intercept ctx.destination so any subsequent AlphaTab worklet.connect(ctx.destination)
    // automatically routes through our Pedalboard InputNode!
    try {
      Object.defineProperty(ctx, 'destination', {
        get: () => inputNode,
        configurable: true,
      });
      this.patchedContexts.add(ctx);
    } catch (err) {
      console.warn('Could not redefine AudioContext.destination:', err);
    }

    // If AlphaTab already created an active worklet node prior to attach, reroute it
    if (activeNode) {
      try {
        activeNode.disconnect();
        activeNode.connect(inputNode);
      } catch {
        // Ignore if not connected
      }
    }

    this.applyConfig(this.currentConfig);
  }

  applyConfig(config: GuitarFxConfig): void {
    this.currentConfig = { ...config };
    if (!this.ctx || !this.inputNode) return;

    const now = this.ctx.currentTime;

    if (!config.enabled) {
      this.dryBypassGain?.gain.setTargetAtTime(1.0, now, 0.015);
      this.wetChainInputGain?.gain.setTargetAtTime(0.0, now, 0.015);
      return;
    }

    this.dryBypassGain?.gain.setTargetAtTime(0.0, now, 0.015);
    this.wetChainInputGain?.gain.setTargetAtTime(1.0, now, 0.015);

    // 1. Drive Curve & Compensation Gain
    if (this.waveShaper && this.preDriveGain && this.postDriveGain && this.preTightFilter) {
      const amount = Math.max(0, Math.min(1, config.driveAmount));
      this.waveShaper.curve = this.buildDriveCurve(config.driveMode, amount);

      if (config.driveMode === 'clean' || amount < 0.02) {
        this.preTightFilter.frequency.setTargetAtTime(30, now, 0.02);
        this.preDriveGain.gain.setTargetAtTime(1.0, now, 0.02);
        this.postDriveGain.gain.setTargetAtTime(1.0, now, 0.02);
      } else if (config.driveMode === 'overdrive') {
        this.preTightFilter.frequency.setTargetAtTime(85, now, 0.02);
        this.preDriveGain.gain.setTargetAtTime(1.0 + amount * 2.5, now, 0.02);
        this.postDriveGain.gain.setTargetAtTime(0.88 / (1 + amount * 0.35), now, 0.02);
      } else if (config.driveMode === 'distortion') {
        this.preTightFilter.frequency.setTargetAtTime(110, now, 0.02);
        this.preDriveGain.gain.setTargetAtTime(1.2 + amount * 4.2, now, 0.02);
        this.postDriveGain.gain.setTargetAtTime(0.82 / (1 + amount * 0.45), now, 0.02);
      } else {
        // Fuzz
        this.preTightFilter.frequency.setTargetAtTime(65, now, 0.02);
        this.preDriveGain.gain.setTargetAtTime(1.5 + amount * 6.0, now, 0.02);
        this.postDriveGain.gain.setTargetAtTime(0.78 / (1 + amount * 0.5), now, 0.02);
      }
    }

    // 2. 4x12 Cabinet Simulation
    if (this.cabHighPass && this.cabLowPass) {
      if (config.cabSimEnabled) {
        this.cabHighPass.frequency.setTargetAtTime(80, now, 0.02);
        this.cabLowPass.frequency.setTargetAtTime(4400, now, 0.02);
        this.cabLowPass.Q.setTargetAtTime(0.95, now, 0.02);
      } else {
        this.cabHighPass.frequency.setTargetAtTime(20, now, 0.02);
        this.cabLowPass.frequency.setTargetAtTime(19500, now, 0.02);
        this.cabLowPass.Q.setTargetAtTime(0.5, now, 0.02);
      }
    }

    // 3. 3-Band EQ
    this.eqBass?.gain.setTargetAtTime(config.bassDb, now, 0.02);
    this.eqMid?.gain.setTargetAtTime(config.midDb, now, 0.02);
    this.eqTreble?.gain.setTargetAtTime(config.trebleDb, now, 0.02);

    // 4. Chorus
    this.chorusWetGain?.gain.setTargetAtTime(config.chorusMix * 0.65, now, 0.02);

    // 5. Delay
    this.delayNode?.delayTime.setTargetAtTime(
      Math.max(0.08, Math.min(1.0, config.delayTimeSec)),
      now,
      0.03
    );
    this.delayFeedbackGain?.gain.setTargetAtTime(
      Math.max(0, Math.min(0.82, config.delayFeedback)),
      now,
      0.02
    );
    this.delayWetGain?.gain.setTargetAtTime(config.delayMix * 0.85, now, 0.02);

    // 6. Reverb
    this.reverbWetGain?.gain.setTargetAtTime(config.reverbMix * 0.9, now, 0.02);
  }

  private buildDriveCurve(
    mode: DriveMode,
    amount: number
  ): Float32Array<ArrayBuffer> {
    const samples = 8192;
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);

    if (mode === 'clean' || amount <= 0.01) {
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = x;
      }
      return curve;
    }

    if (mode === 'overdrive') {
      // Warm asymmetric tube overdrive curve
      const k = 1 + amount * 14;
      const norm = Math.tanh(k);
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        const asym = x >= 0 ? Math.tanh(k * x) : Math.tanh(k * 0.82 * x);
        curve[i] = asym / norm;
      }
      return curve;
    }

    if (mode === 'distortion') {
      // High-gain hard-knee Marshall/Mesa style distortion curve
      const k = 2 + amount * 38;
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        const shaped = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
        curve[i] = Math.max(-0.95, Math.min(0.95, shaped));
      }
      return curve;
    }

    // Fuzz: extreme Big Muff / Fuzz Face harmonic saturation with octave edge
    const k = 6 + amount * 65;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const expClip = Math.sign(x) * (1 - Math.exp(-Math.abs(k * x)));
      const asymmetricBias = 0.08 * (x * x);
      curve[i] = Math.max(-0.98, Math.min(0.98, expClip + asymmetricBias));
    }
    return curve;
  }

  private createStudioImpulseResponse(
    ctx: AudioContext,
    durationSec: number,
    decayRate: number
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decayRate);
        channelData[i] = (Math.random() * 2 - 1) * env * 0.45;
      }
    }
    return impulse;
  }
}
