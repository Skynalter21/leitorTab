// Domain Contracts & Segregated Interfaces (ISP & DIP)
// High-level UI components and hooks depend on these abstractions rather than concrete implementations.

import type {
  GuitarFxConfig,
  LibraryItem,
  OnlineTabResult,
  PitchDetectionResult,
} from './models';

/**
 * Repository contract for persisting and retrieving user tablatures (DIP & LSP).
 * Can be implemented via IndexedDB, LocalStorage, or a Remote Cloud API.
 */
export interface ITablatureRepository {
  getAll(): Promise<LibraryItem[]>;
  save(item: LibraryItem): Promise<void>;
  updateMeta(
    id: string,
    patch: Partial<Omit<LibraryItem, 'id' | 'data'>>
  ): Promise<LibraryItem | null>;
  delete(id: string): Promise<void>;
}

/**
 * Strategy contract for any tab search source (OCP & LSP).
 * New search providers can be added without modifying existing search logic.
 */
export interface ITabSearchProvider {
  readonly providerId: string;
  readonly providerName: string;
  initialize(): Promise<void>;
  search(query: string, limit?: number): OnlineTabResult[];
}

/**
 * Segregated interface for real-time DSP guitar pedalboard & amp simulation (ISP & DIP).
 */
export interface IGuitarEffectsProcessor {
  attachToAudioContext(ctx: AudioContext, activeNode?: AudioNode | null): void;
  applyConfig(config: GuitarFxConfig): void;
  getConfig(): GuitarFxConfig;
}

/**
 * Segregated interface for audio metronome synthesis (ISP).
 */
export interface IMetronomeEngine {
  start(bpm: number): void;
  stop(): void;
}

/**
 * Segregated interface for fundamental pitch detection from time-domain audio samples (ISP).
 */
export interface IPitchDetector {
  detectPitch(buffer: Float32Array, sampleRate: number): PitchDetectionResult | null;
}

/**
 * Segregated interface for playing reference tuning tones (ISP).
 */
export interface IReferenceToneGenerator {
  playTone(frequencyHz: number, durationSeconds?: number): void;
}
