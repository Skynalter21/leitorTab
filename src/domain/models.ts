// Domain Models (Single Responsibility: Pure Data Structures & Types)

export type StudyStatus = 'studying' | 'todo' | 'mastered';

export type SongSectionCategory =
  | 'all'
  | 'intro'
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'solo'
  | 'riff'
  | 'outro'
  | 'other';

export interface SongSection {
  id: string;
  name: string;
  marker?: string;
  category: Exclude<SongSectionCategory, 'all'>;
  startBar: number; // 1-indexed inclusive
  endBar: number; // 1-indexed inclusive
  isCustom?: boolean;
}

export type DriveMode = 'clean' | 'overdrive' | 'distortion' | 'fuzz';

export type CabinetModel =
  | '4x12-british'
  | '4x12-modern'
  | '2x12-american'
  | '1x12-vintage'
  | 'bypass';

export interface GuitarFxConfig {
  enabled: boolean;
  presetId: string;
  driveMode: DriveMode;
  driveAmount: number; // 0.0 to 1.0
  cabSimEnabled: boolean;
  cabModel?: CabinetModel;
  protectDrumsAndBass?: boolean; // Multi-band crossover keeping <105Hz sub-bass & >5.6kHz cymbals clean
  wahAmount?: number; // 0.0 to 1.0 (Auto-Wah / CryBaby sweep)
  phaserMix?: number; // 0.0 to 1.0 (MXR Phase 90 style all-pass phaser)
  tremoloMix?: number; // 0.0 to 1.0 (Optical amplitude modulation)
  bassDb: number; // -12 to +12
  midDb: number; // -12 to +12
  trebleDb: number; // -12 to +12
  chorusMix: number; // 0.0 to 1.0
  delayMix: number; // 0.0 to 0.8
  delayTimeSec: number; // 0.10 to 0.75
  delayFeedback: number; // 0.1 to 0.75
  reverbMix: number; // 0.0 to 0.8
}

export interface SavedSongSettings {
  playbackSpeed?: number;
  mutedTracks?: number[];
  soloTracks?: number[];
  trackVolumes?: Record<number, number>;
  trackPrograms?: Record<number, number>;
  transposeSemitones?: number;
  loopStartBar?: number;
  loopEndBar?: number;
  isLooping?: boolean;
  darkScore?: boolean;
  fxConfig?: GuitarFxConfig;
  customSections?: SongSection[];
  masteredSectionIds?: string[];
}

export interface LibraryItem {
  id: string;
  fileName: string;
  title?: string;
  artist?: string;
  kind: 'gp' | 'pdf';
  data: ArrayBuffer;
  addedAt: number;
  lastOpenedAt: number;
  favorite: boolean;
  status: StudyStatus;
  settings?: SavedSongSettings;
}

export interface GuitarProSource {
  type: 'file' | 'tex';
  data: ArrayBuffer | string;
  fileName: string;
}

export type LoadedDocument =
  | {
      id: string;
      kind: 'gp';
      fileName: string;
      source: GuitarProSource;
      settings?: SavedSongSettings;
    }
  | {
      id: string;
      kind: 'pdf';
      fileName: string;
      buffer: ArrayBuffer;
      settings?: SavedSongSettings;
    };

export interface TrackMixState {
  index: number;
  name: string;
  shortName: string;
  isPercussion: boolean;
  program: number;
  tuning: number[];
  muted: boolean;
  solo: boolean;
  volume: number; // 0.0 to 1.5 (100% = 1.0)
  visible: boolean;
}

export interface OnlineTabResult {
  id: string;
  fileName: string;
  displayTitle: string;
  artist: string;
  ext: string;
  repo: string;
  downloadUrl: string;
}

export interface PitchDetectionResult {
  frequency: number;
  noteName: string;
  octave: number;
  centsOff: number;
}
