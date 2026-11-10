// GuitarProPlayer Coordinator Component (SRP, OCP, DIP)
// Delegates UI rendering to focused subcomponents (GpTransportToolbar, SpeedTrainerBar,
// GuitarEffectsRackBar, TrackMixerSidebar, FretboardVisualizer) and audio DSP/theme/shortcut
// logic to dedicated services & hooks.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as alphaTab from '@coderline/alphatab';
import { FretboardVisualizer, type ActiveFretNote } from './FretboardVisualizer';
import { GpTransportToolbar } from './gp/GpTransportToolbar';
import { SpeedTrainerBar } from './gp/SpeedTrainerBar';
import { GuitarEffectsRackBar } from './gp/GuitarEffectsRackBar';
import { TrackMixerSidebar } from './gp/TrackMixerSidebar';
import { applyScoreTheme } from '../services/alphatab/AlphaTabThemeService';
import {
  WebAudioGuitarEffectsRack,
  DEFAULT_GUITAR_FX_CONFIG,
} from '../services/audio/WebAudioGuitarEffectsRack';
import { usePlayerKeyboardShortcuts } from '../hooks/usePlayerKeyboardShortcuts';
import type { IGuitarEffectsProcessor } from '../domain/contracts';
import type {
  GuitarFxConfig,
  GuitarProSource,
  SavedSongSettings,
  TrackMixState,
} from '../domain/models';

export type { GuitarProSource };

interface AlphaSynthWebOutputInternal {
  context?: AudioContext;
  _worklet?: AudioNode | null;
  _audioNode?: AudioNode | null;
}

function updateTrackInstrumentProgram(
  scoreTrack: alphaTab.model.Track,
  program: number
): void {
  if (scoreTrack.playbackInfo) {
    scoreTrack.playbackInfo.program = program;
  }
  for (const staff of scoreTrack.staves) {
    for (const bar of staff.bars) {
      for (const voice of bar.voices) {
        for (const beat of voice.beats) {
          if (beat.automations) {
            for (const auto of beat.automations) {
              if (auto.type === alphaTab.model.AutomationType.Instrument) {
                auto.value = program;
              }
            }
          }
        }
      }
    }
  }
}

const defaultFxProcessor: IGuitarEffectsProcessor = new WebAudioGuitarEffectsRack();

interface GuitarProPlayerProps {
  source: GuitarProSource;
  initialSettings?: SavedSongSettings;
  onSaveSettings?: (settings: SavedSongSettings) => void;
  onMetadataLoaded?: (meta: { title: string; artist: string }) => void;
  fxProcessor?: IGuitarEffectsProcessor;
}

export const GuitarProPlayer: React.FC<GuitarProPlayerProps> = ({
  source,
  initialSettings,
  onSaveSettings,
  onMetadataLoaded,
  fxProcessor = defaultFxProcessor,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<alphaTab.AlphaTabApi | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundFontReady, setSoundFontReady] = useState<boolean>(false);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Song metadata
  const [songTitle, setSongTitle] = useState<string>('');
  const [songArtist, setSongArtist] = useState<string>('');
  const [baseTempo, setBaseTempo] = useState<number>(120);
  const [totalBars, setTotalBars] = useState<number>(0);

  // Tracks & mixer state
  const [tracks, setTracks] = useState<TrackMixState[]>([]);
  const [focusedTrackIndex, setFocusedTrackIndex] = useState<number>(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [endTick, setEndTick] = useState<number>(0);

  // Practice controls
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(
    initialSettings?.playbackSpeed ?? 1.0
  );
  const [isLooping, setIsLooping] = useState<boolean>(
    initialSettings?.isLooping ?? false
  );
  const [loopStartBar, setLoopStartBar] = useState<number>(1);
  const [loopEndBar, setLoopEndBar] = useState<number>(1);
  const [hasActiveRange, setHasActiveRange] = useState<boolean>(false);
  const [transposeSemitones, setTransposeSemitones] = useState<number>(
    initialSettings?.transposeSemitones ?? 0
  );
  const [darkScore, setDarkScore] = useState<boolean>(
    initialSettings?.darkScore ?? false
  );

  // Guitar Amp & Pedalboard Effects Rack state
  const [showFxRack, setShowFxRack] = useState<boolean>(true);
  const [fxConfig, setFxConfig] = useState<GuitarFxConfig>(
    initialSettings?.fxConfig ?? DEFAULT_GUITAR_FX_CONFIG
  );

  // Speed Trainer state
  const [showSpeedTrainer, setShowSpeedTrainer] = useState<boolean>(false);
  const [speedTrainerActive, setSpeedTrainerActive] = useState<boolean>(false);
  const [trainerStartSpeed, setTrainerStartSpeed] = useState<number>(0.6);
  const [trainerTargetSpeed, setTrainerTargetSpeed] = useState<number>(1.0);
  const [trainerStepPct, setTrainerStepPct] = useState<number>(0.05);
  const [trainerEveryLoops, setTrainerEveryLoops] = useState<number>(2);
  const [trainerLoopCounter, setTrainerLoopCounter] = useState<number>(0);

  // Fretboard visualizer state
  const [showFretboard, setShowFretboard] = useState<boolean>(true);
  const [activeFretNotes, setActiveFretNotes] = useState<ActiveFretNote[]>([]);

  const [masterVolume, setMasterVolume] = useState<number>(1.0);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(false);
  const [countInEnabled, setCountInEnabled] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [layoutMode, setLayoutMode] = useState<'page' | 'horizontal'>('page');
  const [showMixer, setShowMixer] = useState<boolean>(true);

  const prevTickRef = useRef<number>(0);
  const fxConfigRef = useRef<GuitarFxConfig>(fxConfig);
  useEffect(() => {
    fxConfigRef.current = fxConfig;
  }, [fxConfig]);

  const attachAndSyncFx = useCallback(
    (api: alphaTab.AlphaTabApi | null, cfg: GuitarFxConfig) => {
      if (!api || !api.player) return;
      const playerInternal = api.player as unknown as {
        output?: AlphaSynthWebOutputInternal;
      };
      const output = playerInternal.output;
      if (output?.context) {
        fxProcessor.attachToAudioContext(
          output.context,
          output._worklet || output._audioNode || null
        );
      }
      fxProcessor.applyConfig(cfg);
    },
    [fxProcessor]
  );

  const speedTrainerRef = useRef({
    active: false,
    start: 0.6,
    target: 1.0,
    step: 0.05,
    everyLoops: 2,
    counter: 0,
    currentSpeed: 1.0,
  });

  useEffect(() => {
    speedTrainerRef.current = {
      active: speedTrainerActive,
      start: trainerStartSpeed,
      target: trainerTargetSpeed,
      step: trainerStepPct,
      everyLoops: trainerEveryLoops,
      counter: trainerLoopCounter,
      currentSpeed: playbackSpeed,
    };
  }, [
    speedTrainerActive,
    trainerStartSpeed,
    trainerTargetSpeed,
    trainerStepPct,
    trainerEveryLoops,
    trainerLoopCounter,
    playbackSpeed,
  ]);

  const focusedTrackRef = useRef<number>(0);
  useEffect(() => {
    focusedTrackRef.current = focusedTrackIndex;
  }, [focusedTrackIndex]);

  const initialSettingsRef = useRef<SavedSongSettings | undefined>(initialSettings);
  useEffect(() => {
    initialSettingsRef.current = initialSettings;
  }, [initialSettings]);

  const onMetadataLoadedRef = useRef(onMetadataLoaded);
  useEffect(() => {
    onMetadataLoadedRef.current = onMetadataLoaded;
  }, [onMetadataLoaded]);

  const persistCurrentSettings = useCallback(
    (patch: Partial<SavedSongSettings>, currentTracksState?: TrackMixState[]) => {
      if (!onSaveSettings) return;
      const tList = currentTracksState ?? tracks;
      const mutedTracks = tList.filter((t) => t.muted).map((t) => t.index);
      const soloTracks = tList.filter((t) => t.solo).map((t) => t.index);
      const trackVolumes: Record<number, number> = {};
      const trackPrograms: Record<number, number> = {};
      tList.forEach((t) => {
        if (t.volume !== 1.0) {
          trackVolumes[t.index] = t.volume;
        }
        if (!t.isPercussion) {
          trackPrograms[t.index] = t.program;
        }
      });

      onSaveSettings({
        playbackSpeed,
        mutedTracks,
        soloTracks,
        trackVolumes,
        trackPrograms,
        transposeSemitones,
        isLooping,
        darkScore,
        fxConfig,
        ...patch,
      });
    },
    [
      onSaveSettings,
      tracks,
      playbackSpeed,
      transposeSemitones,
      isLooping,
      darkScore,
      fxConfig,
    ]
  );

  // Initialize AlphaTab engine
  useEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    setIsLoading(true);
    setErrorMessage(null);

    const settings = new alphaTab.Settings();
    settings.core.fontDirectory = '/font/';
    settings.core.engine = 'svg';
    settings.display.scale = 1.0;
    settings.display.layoutMode = alphaTab.LayoutMode.Page;
    applyScoreTheme(
      settings.display.resources,
      Boolean(initialSettingsRef.current?.darkScore)
    );
    settings.player.playerMode = alphaTab.PlayerMode.EnabledAutomatic;
    settings.player.soundFont = '/soundfont/sonivox.sf2';
    settings.player.scrollElement = viewport;
    settings.player.enableCursor = true;
    settings.player.enableAnimatedBeatCursor = true;
    settings.player.enableElementHighlighting = true;
    settings.player.enableSeekToClick = true;
    settings.player.enablePlaybackRangeSelection = true;

    let api: alphaTab.AlphaTabApi;
    try {
      api = new alphaTab.AlphaTabApi(container, settings);
      apiRef.current = api;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao inicializar o motor AlphaTab.'
      );
      setIsLoading(false);
      return;
    }

    const onScoreLoaded = (score: alphaTab.model.Score) => {
      const resolvedTitle = score.title || source.fileName;
      const resolvedArtist = score.artist || score.subTitle || 'Artista desconhecido';
      setSongTitle(resolvedTitle);
      setSongArtist(resolvedArtist);
      setBaseTempo(score.tempo || 120);
      setTotalBars(score.masterBars.length);
      setLoopStartBar(1);
      setLoopEndBar(score.masterBars.length);
      setHasActiveRange(false);
      setActiveFretNotes([]);
      setFocusedTrackIndex(0);

      onMetadataLoadedRef.current?.({
        title: resolvedTitle,
        artist: resolvedArtist,
      });

      const saved = initialSettingsRef.current;
      const mutedSet = new Set(saved?.mutedTracks || []);
      const soloSet = new Set(saved?.soloTracks || []);
      const volMap = saved?.trackVolumes || {};
      const progMap = saved?.trackPrograms || {};

      let anyCustomProgramApplied = false;
      const loadedTracks: TrackMixState[] = score.tracks.map((t, idx) => {
        const isPerc = t.playbackInfo?.primaryChannel === 9;
        const savedProg = progMap[t.index];
        if (!isPerc && typeof savedProg === 'number') {
          updateTrackInstrumentProgram(t, savedProg);
          anyCustomProgramApplied = true;
        }
        const staffTuning = t.staves[0]?.tuning || [];
        return {
          index: t.index,
          name: t.name || `Trilha ${idx + 1}`,
          shortName: t.shortName || `T${idx + 1}`,
          isPercussion: isPerc,
          program: t.playbackInfo?.program ?? 25,
          tuning: staffTuning.length > 0 ? staffTuning : [64, 59, 55, 50, 45, 40],
          muted: mutedSet.has(t.index),
          solo: soloSet.has(t.index),
          volume: volMap[t.index] ?? 1.0,
          visible: idx === 0,
        };
      });

      if (anyCustomProgramApplied) {
        try {
          api.loadMidiForScore();
        } catch {
          // Ignore if MIDI reloads on playerReady
        }
      }

      setTracks(loadedTracks);
      setIsLoading(false);
    };

    const onRenderFinished = () => {
      setIsLoading(false);
    };

    const onError = (err: Error) => {
      console.error('AlphaTab error:', err);
      setErrorMessage(`Erro ao carregar tablatura: ${err.message || 'Formato inválido'}`);
      setIsLoading(false);
    };

    const onSoundFontLoaded = () => {
      setSoundFontReady(true);
    };

    const onPlayerReady = () => {
      setPlayerReady(true);
      setSoundFontReady(true);

      const saved = initialSettingsRef.current;
      const initialFx = saved?.fxConfig ?? fxConfigRef.current;
      setFxConfig(initialFx);
      attachAndSyncFx(api, initialFx);

      if (saved && api.score) {
        if (saved.playbackSpeed) {
          api.playbackSpeed = saved.playbackSpeed;
          setPlaybackSpeed(saved.playbackSpeed);
        }
        if (typeof saved.isLooping === 'boolean') {
          api.isLooping = saved.isLooping;
          setIsLooping(saved.isLooping);
        }
        if (saved.transposeSemitones) {
          const pitchedTracks = api.score.tracks.filter(
            (t) => t.playbackInfo?.primaryChannel !== 9
          );
          api.changeTrackTranspositionPitch(pitchedTracks, saved.transposeSemitones);
          setTransposeSemitones(saved.transposeSemitones);
        }
        api.score.tracks.forEach((scoreTrack) => {
          if (saved.mutedTracks?.includes(scoreTrack.index)) {
            api.changeTrackMute([scoreTrack], true);
          }
          if (saved.soloTracks?.includes(scoreTrack.index)) {
            api.changeTrackSolo([scoreTrack], true);
          }
          const vol = saved.trackVolumes?.[scoreTrack.index];
          if (typeof vol === 'number') {
            api.changeTrackVolume([scoreTrack], vol);
          }
        });
      }
    };

    const onPlayerStateChanged = (args: alphaTab.synth.PlayerStateChangedEventArgs) => {
      const playing = args.state === alphaTab.synth.PlayerState.Playing;
      setIsPlaying(playing);
      if (playing) {
        attachAndSyncFx(api, fxConfigRef.current);
      } else {
        setActiveFretNotes([]);
      }
    };

    const onPositionChanged = (args: alphaTab.synth.PositionChangedEventArgs) => {
      setCurrentTime(args.currentTime);
      setEndTime(args.endTime);
      setCurrentTick(args.currentTick);
      setEndTick(args.endTick);

      const st = speedTrainerRef.current;
      if (st.active && prevTickRef.current - args.currentTick > 600) {
        const nextCounter = st.counter + 1;
        if (nextCounter >= st.everyLoops) {
          setTrainerLoopCounter(0);
          const nextSpeed = Math.min(
            st.target,
            Math.round((st.currentSpeed + st.step) * 100) / 100
          );
          setPlaybackSpeed(nextSpeed);
          api.playbackSpeed = nextSpeed;
        } else {
          setTrainerLoopCounter(nextCounter);
        }
      }
      prevTickRef.current = args.currentTick;
    };

    const onPlaybackRangeChanged = (args: alphaTab.synth.PlaybackRangeChangedEventArgs) => {
      setHasActiveRange(
        Boolean(
          args.playbackRange &&
            args.playbackRange.startTick >= 0 &&
            args.playbackRange.endTick > args.playbackRange.startTick
        )
      );
    };

    const onActiveBeatsChanged = (args: alphaTab.synth.ActiveBeatsChangedEventArgs) => {
      const currentFocus = focusedTrackRef.current;
      const notesOnFretboard: ActiveFretNote[] = [];

      for (const beat of args.activeBeats) {
        const trackIdx = beat.voice?.bar?.staff?.track?.index ?? 0;
        if (trackIdx !== currentFocus) continue;

        const staffTuning = beat.voice?.bar?.staff?.tuning || [];
        const numStrings = staffTuning.length || 6;

        for (const note of beat.notes) {
          if (note.isStringed && note.string >= 1 && note.fret >= 0) {
            const rowIndex = Math.max(
              0,
              Math.min(numStrings - 1, numStrings - note.string)
            );
            notesOnFretboard.push({
              stringIndex: rowIndex,
              fret: note.fret,
              trackIndex: trackIdx,
            });
          }
        }
      }
      setActiveFretNotes(notesOnFretboard);
    };

    api.scoreLoaded.on(onScoreLoaded);
    api.renderFinished.on(onRenderFinished);
    api.error.on(onError);
    api.soundFontLoaded.on(onSoundFontLoaded);
    api.playerReady.on(onPlayerReady);
    api.playerStateChanged.on(onPlayerStateChanged);
    api.playerPositionChanged.on(onPositionChanged);
    api.playbackRangeChanged.on(onPlaybackRangeChanged);
    api.activeBeatsChanged.on(onActiveBeatsChanged);

    return () => {
      try {
        api.destroy();
      } catch {
        // Ignore cleanup errors
      }
      apiRef.current = null;
    };
  }, [attachAndSyncFx, source.fileName]);

  // Load new source whenever `source` changes
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsPlaying(false);
    prevTickRef.current = 0;

    try {
      api.stop();
      api.playbackRange = null;
      setHasActiveRange(false);

      if (source.type === 'tex' && typeof source.data === 'string') {
        api.tex(source.data, [0]);
      } else if (source.type === 'file' && source.data instanceof ArrayBuffer) {
        api.load(new Uint8Array(source.data.slice(0)), [0]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erro ao processar arquivo de tablatura.'
      );
      setIsLoading(false);
    }
  }, [source]);

  // Guitar Effects Rack Handler
  const handleFxConfigChange = useCallback(
    (nextConfig: GuitarFxConfig) => {
      setFxConfig(nextConfig);
      attachAndSyncFx(apiRef.current, nextConfig);
      persistCurrentSettings({ fxConfig: nextConfig });
    },
    [attachAndSyncFx, persistCurrentSettings]
  );

  // Track Mixer Handlers
  const toggleTrackMute = useCallback(
    (trackIndex: number) => {
      const api = apiRef.current;
      if (!api || !api.score) return;

      const scoreTrack = api.score.tracks[trackIndex];
      if (!scoreTrack) return;

      setTracks((prev) => {
        const updated = prev.map((t) => {
          if (t.index !== trackIndex) return t;
          const nextMuted = !t.muted;
          api.changeTrackMute([scoreTrack], nextMuted);
          return { ...t, muted: nextMuted };
        });
        persistCurrentSettings({}, updated);
        return updated;
      });
    },
    [persistCurrentSettings]
  );

  const toggleTrackSolo = useCallback(
    (trackIndex: number) => {
      const api = apiRef.current;
      if (!api || !api.score) return;

      const scoreTrack = api.score.tracks[trackIndex];
      if (!scoreTrack) return;

      setTracks((prev) => {
        const updated = prev.map((t) => {
          if (t.index !== trackIndex) return t;
          const nextSolo = !t.solo;
          api.changeTrackSolo([scoreTrack], nextSolo);
          return { ...t, solo: nextSolo };
        });
        persistCurrentSettings({}, updated);
        return updated;
      });
    },
    [persistCurrentSettings]
  );

  const changeTrackVolume = useCallback(
    (trackIndex: number, volume: number) => {
      const api = apiRef.current;
      if (!api || !api.score) return;

      const scoreTrack = api.score.tracks[trackIndex];
      if (!scoreTrack) return;

      api.changeTrackVolume([scoreTrack], volume);
      setTracks((prev) => {
        const updated = prev.map((t) =>
          t.index === trackIndex ? { ...t, volume } : t
        );
        persistCurrentSettings({}, updated);
        return updated;
      });
    },
    [persistCurrentSettings]
  );

  const changeTrackProgram = useCallback(
    (trackIndex: number, program: number) => {
      const api = apiRef.current;
      if (!api || !api.score) return;

      const scoreTrack = api.score.tracks[trackIndex];
      if (!scoreTrack) return;

      const savedTick = api.tickPosition;
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        api.pause();
      }

      updateTrackInstrumentProgram(scoreTrack, program);
      api.loadMidiForScore();

      if (transposeSemitones !== 0) {
        const pitchedTracks = api.score.tracks.filter(
          (t) => t.playbackInfo?.primaryChannel !== 9
        );
        api.changeTrackTranspositionPitch(pitchedTracks, transposeSemitones);
      }

      setTracks((prev) => {
        const updated = prev.map((t) =>
          t.index === trackIndex ? { ...t, program } : t
        );
        updated.forEach((tr) => {
          const st = api.score?.tracks[tr.index];
          if (!st) return;
          if (tr.muted) api.changeTrackMute([st], true);
          if (tr.solo) api.changeTrackSolo([st], true);
          if (tr.volume !== 1.0) api.changeTrackVolume([st], tr.volume);
        });
        persistCurrentSettings({}, updated);
        return updated;
      });

      api.tickPosition = savedTick;
      if (wasPlaying) {
        api.play();
      }
    },
    [isPlaying, transposeSemitones, persistCurrentSettings]
  );

  const resetAllMuteSolo = useCallback(() => {
    const api = apiRef.current;
    if (!api || !api.score) return;

    api.score.tracks.forEach((scoreTrack) => {
      api.changeTrackMute([scoreTrack], false);
      api.changeTrackSolo([scoreTrack], false);
      api.changeTrackVolume([scoreTrack], 1.0);
    });

    setTracks((prev) => {
      const updated = prev.map((t) => ({
        ...t,
        muted: false,
        solo: false,
        volume: 1.0,
      }));
      persistCurrentSettings({}, updated);
      return updated;
    });
  }, [persistCurrentSettings]);

  const selectSingleTrack = useCallback((trackIndex: number) => {
    const api = apiRef.current;
    if (!api || !api.score) return;

    const scoreTrack = api.score.tracks[trackIndex];
    if (!scoreTrack) return;

    setFocusedTrackIndex(trackIndex);
    api.renderTracks([scoreTrack]);
    setTracks((prev) =>
      prev.map((t) => ({ ...t, visible: t.index === trackIndex }))
    );
  }, []);

  const toggleTrackVisibility = useCallback((trackIndex: number) => {
    const api = apiRef.current;
    if (!api || !api.score) return;

    setTracks((prev) => {
      const target = prev.find((t) => t.index === trackIndex);
      if (!target) return prev;

      const visibleCount = prev.filter((t) => t.visible).length;
      if (target.visible && visibleCount <= 1) return prev;

      const updated = prev.map((t) =>
        t.index === trackIndex ? { ...t, visible: !t.visible } : t
      );

      const tracksToRender = updated
        .filter((t) => t.visible)
        .map((t) => api.score!.tracks[t.index])
        .filter(Boolean);

      if (tracksToRender.length > 0) {
        api.renderTracks(tracksToRender);
      }

      return updated;
    });
  }, []);

  const showAllTracks = useCallback(() => {
    const api = apiRef.current;
    if (!api || !api.score) return;

    api.renderTracks(api.score.tracks);
    setTracks((prev) => prev.map((t) => ({ ...t, visible: true })));
  }, []);

  // Transport & Practice Handlers
  const handlePlayPause = useCallback(() => {
    attachAndSyncFx(apiRef.current, fxConfigRef.current);
    apiRef.current?.playPause();
  }, [attachAndSyncFx]);

  const handleStop = useCallback(() => {
    apiRef.current?.stop();
  }, []);

  const handleSeekTick = useCallback((nextTick: number) => {
    if (apiRef.current) {
      apiRef.current.tickPosition = nextTick;
      setCurrentTick(nextTick);
    }
  }, []);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      const clamped = Math.max(0.25, Math.min(2.0, Math.round(speed * 100) / 100));
      setPlaybackSpeed(clamped);
      if (apiRef.current) {
        apiRef.current.playbackSpeed = clamped;
      }
      persistCurrentSettings({ playbackSpeed: clamped });
    },
    [persistCurrentSettings]
  );

  const handleToggleLoop = useCallback(() => {
    const next = !isLooping;
    setIsLooping(next);
    if (apiRef.current) {
      apiRef.current.isLooping = next;
    }
    persistCurrentSettings({ isLooping: next });
  }, [isLooping, persistCurrentSettings]);

  const applyBarLoopRange = useCallback(() => {
    const api = apiRef.current;
    if (!api || !api.tickCache) return;

    const sIdx = Math.max(0, Math.min(loopStartBar - 1, totalBars - 1));
    const eIdx = Math.max(sIdx, Math.min(loopEndBar - 1, totalBars - 1));

    const masterBars = api.tickCache.masterBars;
    const startLookup = masterBars[sIdx];
    const endLookup = masterBars[eIdx];

    if (startLookup && endLookup) {
      api.playbackRange = {
        startTick: startLookup.start,
        endTick: endLookup.end,
      };
      api.tickPosition = startLookup.start;
      api.isLooping = true;
      setIsLooping(true);
      setHasActiveRange(true);
      persistCurrentSettings({ isLooping: true });
    }
  }, [loopStartBar, loopEndBar, totalBars, persistCurrentSettings]);

  const clearLoopRange = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.playbackRange = null;
      setHasActiveRange(false);
    }
  }, []);

  const handleToggleSpeedTrainer = useCallback(() => {
    const nextActive = !speedTrainerActive;
    setSpeedTrainerActive(nextActive);
    setTrainerLoopCounter(0);

    if (nextActive && apiRef.current) {
      apiRef.current.isLooping = true;
      setIsLooping(true);
      apiRef.current.playbackSpeed = trainerStartSpeed;
      setPlaybackSpeed(trainerStartSpeed);
    }
  }, [speedTrainerActive, trainerStartSpeed]);

  const handleTransposeChange = useCallback(
    (delta: number) => {
      const api = apiRef.current;
      if (!api || !api.score) return;

      const next = Math.max(-6, Math.min(6, transposeSemitones + delta));
      setTransposeSemitones(next);

      const pitchedTracks = api.score.tracks.filter(
        (t) => t.playbackInfo?.primaryChannel !== 9
      );
      api.changeTrackTranspositionPitch(pitchedTracks, next);
      persistCurrentSettings({ transposeSemitones: next });
    },
    [transposeSemitones, persistCurrentSettings]
  );

  const handleToggleDarkScore = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const nextDark = !darkScore;
    setDarkScore(nextDark);
    applyScoreTheme(api.settings.display.resources, nextDark);
    api.updateSettings();
    api.render();
    persistCurrentSettings({ darkScore: nextDark });
  }, [darkScore, persistCurrentSettings]);

  const handleMasterVolume = useCallback((val: number) => {
    setMasterVolume(val);
    if (apiRef.current) {
      apiRef.current.masterVolume = val;
    }
  }, []);

  const handleToggleMetronome = useCallback(() => {
    const next = !metronomeEnabled;
    setMetronomeEnabled(next);
    if (apiRef.current) {
      apiRef.current.metronomeVolume = next ? 1.0 : 0.0;
    }
  }, [metronomeEnabled]);

  const handleToggleCountIn = useCallback(() => {
    const next = !countInEnabled;
    setCountInEnabled(next);
    if (apiRef.current) {
      apiRef.current.countInVolume = next ? 1.0 : 0.0;
    }
  }, [countInEnabled]);

  const handleZoom = useCallback(
    (delta: number) => {
      const api = apiRef.current;
      if (!api) return;
      const next = Math.max(0.5, Math.min(2.0, Math.round((zoomScale + delta) * 10) / 10));
      setZoomScale(next);
      api.settings.display.scale = next;
      api.updateSettings();
      api.render();
    },
    [zoomScale]
  );

  const handleToggleLayout = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const next = layoutMode === 'page' ? 'horizontal' : 'page';
    setLayoutMode(next);
    api.settings.display.layoutMode =
      next === 'page' ? alphaTab.LayoutMode.Page : alphaTab.LayoutMode.Horizontal;
    api.updateSettings();
    api.render();
  }, [layoutMode]);

  // Keyboard shortcuts via dedicated SRP hook
  usePlayerKeyboardShortcuts({
    enabled: playerReady,
    onPlayPause: handlePlayPause,
    onToggleMuteFocused: () => toggleTrackMute(focusedTrackIndex),
    onToggleSoloFocused: () => toggleTrackSolo(focusedTrackIndex),
    onToggleLoop: handleToggleLoop,
    onSeekRelativeTicks: (delta) => {
      if (apiRef.current) {
        apiRef.current.tickPosition = Math.max(0, Math.min(endTick, currentTick + delta));
      }
    },
  });

  const effectiveBpm = Math.round(baseTempo * playbackSpeed);
  const focusedTrack = tracks.find((t) => t.index === focusedTrackIndex) || tracks[0];

  return (
    <div className="gp-workspace">
      <GpTransportToolbar
        trackCount={tracks.length}
        showMixer={showMixer}
        onToggleMixer={() => setShowMixer((v) => !v)}
        playerReady={playerReady}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        currentTime={currentTime}
        endTime={endTime}
        currentTick={currentTick}
        endTick={endTick}
        onSeekTick={handleSeekTick}
        playbackSpeed={playbackSpeed}
        effectiveBpm={effectiveBpm}
        onSpeedChange={handleSpeedChange}
        isLooping={isLooping}
        onToggleLoop={handleToggleLoop}
        totalBars={totalBars}
        loopStartBar={loopStartBar}
        loopEndBar={loopEndBar}
        onChangeLoopStartBar={(val) => {
          setLoopStartBar(val);
          if (val > loopEndBar) setLoopEndBar(val);
        }}
        onChangeLoopEndBar={setLoopEndBar}
        onApplyBarLoopRange={applyBarLoopRange}
        hasActiveRange={hasActiveRange}
        onClearLoopRange={clearLoopRange}
        showSpeedTrainer={showSpeedTrainer}
        speedTrainerActive={speedTrainerActive}
        onToggleShowSpeedTrainer={() => setShowSpeedTrainer((v) => !v)}
        transposeSemitones={transposeSemitones}
        onTransposeChange={handleTransposeChange}
        showFxRack={showFxRack}
        fxEnabled={fxConfig.enabled}
        onToggleShowFxRack={() => setShowFxRack((v) => !v)}
        showFretboard={showFretboard}
        onToggleFretboard={() => setShowFretboard((v) => !v)}
        darkScore={darkScore}
        onToggleDarkScore={handleToggleDarkScore}
        metronomeEnabled={metronomeEnabled}
        onToggleMetronome={handleToggleMetronome}
        countInEnabled={countInEnabled}
        onToggleCountIn={handleToggleCountIn}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolume}
        zoomScale={zoomScale}
        onZoomChange={handleZoom}
        layoutMode={layoutMode}
        onToggleLayout={handleToggleLayout}
      />

      {showFxRack && (
        <GuitarEffectsRackBar
          config={fxConfig}
          onChangeConfig={handleFxConfigChange}
        />
      )}

      {showSpeedTrainer && (
        <SpeedTrainerBar
          active={speedTrainerActive}
          startSpeed={trainerStartSpeed}
          targetSpeed={trainerTargetSpeed}
          stepPct={trainerStepPct}
          everyLoops={trainerEveryLoops}
          loopCounter={trainerLoopCounter}
          currentPlaybackSpeed={playbackSpeed}
          onChangeStartSpeed={setTrainerStartSpeed}
          onChangeTargetSpeed={setTrainerTargetSpeed}
          onChangeStepPct={setTrainerStepPct}
          onChangeEveryLoops={setTrainerEveryLoops}
          onToggleActive={handleToggleSpeedTrainer}
        />
      )}

      <div className="gp-body">
        {showMixer && (
          <TrackMixerSidebar
            tracks={tracks}
            focusedTrackIndex={focusedTrackIndex}
            onSelectSingleTrack={selectSingleTrack}
            onToggleTrackVisibility={toggleTrackVisibility}
            onShowAllTracks={showAllTracks}
            onToggleTrackMute={toggleTrackMute}
            onToggleTrackSolo={toggleTrackSolo}
            onChangeTrackVolume={changeTrackVolume}
            onChangeTrackProgram={changeTrackProgram}
            onResetAllMuteSolo={resetAllMuteSolo}
          />
        )}

        <div className="score-viewport" ref={viewportRef}>
          <div className="score-meta-bar">
            <div>
              <h2 className="score-title">{songTitle || source.fileName}</h2>
              <p className="score-artist">
                {songArtist} • Original: {baseTempo} BPM • {totalBars} compassos
                {transposeSemitones !== 0 &&
                  ` • Afinação: ${
                    transposeSemitones > 0
                      ? `+${transposeSemitones}`
                      : transposeSemitones
                  } semitons`}
              </p>
            </div>
            <div className="synth-status">
              <span
                className={`status-dot ${
                  playerReady ? 'ready' : soundFontReady ? 'loading' : 'waiting'
                }`}
              />
              <span>
                {playerReady
                  ? fxConfig.enabled
                    ? `Pedaleira Ativa (${fxConfig.driveMode.toUpperCase()} + Amp)`
                    : 'Áudio Pronto (SoundFont Bypass)'
                  : 'Carregando banco de áudio MIDI...'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="error-banner">
              <strong>Erro:</strong> {errorMessage}
            </div>
          )}

          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <p>Renderizando tablatura e partitura...</p>
            </div>
          )}

          <div className={`alphatab-paper-wrapper ${darkScore ? 'dark-sheet' : ''}`}>
            <div ref={containerRef} className="alphatab-surface" />
          </div>
        </div>
      </div>

      {showFretboard && focusedTrack && !focusedTrack.isPercussion && (
        <FretboardVisualizer
          trackName={focusedTrack.name}
          tuningPitches={focusedTrack.tuning}
          transposeSemitones={transposeSemitones}
          activeNotes={activeFretNotes}
        />
      )}
    </div>
  );
};
