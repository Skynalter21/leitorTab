// Concrete Audio Services implementing Domain Contracts (SRP, ISP, LSP)

import type {
  IMetronomeEngine,
  IPitchDetector,
  IReferenceToneGenerator,
} from '../../domain/contracts';
import type { PitchDetectionResult } from '../../domain/models';

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Single Responsibility: Synthesizes accurate 4/4 metronome clicks via Web Audio API.
 */
export class WebAudioMetronomeEngine implements IMetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private timerId: number | null = null;

  start(bpm: number): void {
    this.stop();

    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let beatCount = 0;
    const playClick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = beatCount % 4 === 0 ? 1100 : 750;

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.065);
      beatCount = (beatCount + 1) % 4;
    };

    playClick();
    const intervalMs = (60 / Math.max(40, Math.min(240, bpm))) * 1000;
    this.timerId = window.setInterval(playClick, intervalMs);
  }

  stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * Single Responsibility: Detects fundamental frequency and musical pitch from audio buffers
 * using time-domain autocorrelation.
 */
export class AutocorrelationPitchDetector implements IPitchDetector {
  detectPitch(buf: Float32Array, sampleRate: number): PitchDetectionResult | null {
    const freq = this.autoCorrelate(buf, sampleRate);
    if (freq === -1 || freq < 35 || freq > 1200) {
      return null;
    }

    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
    const roundedNote = Math.round(noteNum);
    const noteName = NOTE_STRINGS[roundedNote % 12];
    const octave = Math.floor(roundedNote / 12) - 1;
    const targetFreq = 440 * Math.pow(2, (roundedNote - 69) / 12);
    const centsOff = Math.max(
      -50,
      Math.min(50, Math.floor((1200 * Math.log(freq / targetFreq)) / Math.log(2)))
    );

    return {
      frequency: Math.round(freq * 10) / 10,
      noteName,
      octave,
      centsOff,
    };
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    let size = buf.length;
    let rms = 0;

    for (let i = 0; i < size; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.012) return -1;

    let r1 = 0;
    let r2 = size - 1;
    const threshold = 0.2;

    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buf[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buf[size - i]) < threshold) {
        r2 = size - i;
        break;
      }
    }

    const trimmed = buf.slice(r1, r2);
    size = trimmed.length;

    const c = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (d < size - 1 && c[d] > c[d + 1]) {
      d++;
    }
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    if (T0 > 0 && T0 < size - 1) {
      const x1 = c[T0 - 1];
      const x2 = c[T0];
      const x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
    }

    return sampleRate / T0;
  }
}

/**
 * Single Responsibility: Plays reference tuning notes via Web Audio API.
 */
export class WebAudioReferenceToneGenerator implements IReferenceToneGenerator {
  private audioCtx: AudioContext | null = null;

  playTone(frequencyHz: number, durationSeconds = 1.8): void {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSeconds);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSeconds + 0.05);
  }
}

