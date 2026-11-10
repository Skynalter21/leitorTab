// Single Responsibility Component: Instrument Track Mixer Sidebar
// Controls Mute (M), Solo (S), Volume, Track Visibility, and Per-Track Guitar/Bass Tone (MIDI Program)

import React from 'react';
import type { TrackMixState } from '../../domain/models';
import { GUITAR_MIDI_PROGRAMS } from '../../services/audio/WebAudioGuitarEffectsRack';
import {
  RotateCcw,
  CheckSquare,
  Square as SquareIcon,
  Music,
  VolumeX,
  Headphones,
  Volume2,
} from 'lucide-react';

interface TrackMixerSidebarProps {
  tracks: TrackMixState[];
  focusedTrackIndex: number;
  onSelectSingleTrack: (trackIndex: number) => void;
  onToggleTrackVisibility: (trackIndex: number) => void;
  onShowAllTracks: () => void;
  onToggleTrackMute: (trackIndex: number) => void;
  onToggleTrackSolo: (trackIndex: number) => void;
  onChangeTrackVolume: (trackIndex: number, volume: number) => void;
  onChangeTrackProgram: (trackIndex: number, program: number) => void;
  onResetAllMuteSolo: () => void;
}

export const TrackMixerSidebar: React.FC<TrackMixerSidebarProps> = ({
  tracks,
  focusedTrackIndex,
  onSelectSingleTrack,
  onToggleTrackVisibility,
  onShowAllTracks,
  onToggleTrackMute,
  onToggleTrackSolo,
  onChangeTrackVolume,
  onChangeTrackProgram,
  onResetAllMuteSolo,
}) => {
  const anyMutedOrSolo = tracks.some((t) => t.muted || t.solo || t.volume !== 1.0);
  const anySoloActive = tracks.some((t) => t.solo);

  return (
    <aside className="track-mixer">
      <div className="mixer-header">
        <div>
          <h3>Instrumentos & Timbres</h3>
          <p className="mixer-subtitle">
            Mute (M), Solo (S), Volume e Som do Instrumento
          </p>
        </div>
        <div className="mixer-header-actions">
          {tracks.length > 1 && (
            <button
              type="button"
              className="btn-xs"
              onClick={onShowAllTracks}
              title="Exibir todas as trilhas juntas na partitura"
            >
              Ver Todas
            </button>
          )}
          {anyMutedOrSolo && (
            <button
              type="button"
              className="btn-xs reset"
              onClick={onResetAllMuteSolo}
              title="Resetar Mute, Solo e Volume de todos os instrumentos"
            >
              <RotateCcw size={12} /> Resetar
            </button>
          )}
        </div>
      </div>

      <div className="track-list">
        {tracks.map((track) => {
          const effectivelySilenced =
            track.muted || (anySoloActive && !track.solo);
          const isFocused = track.index === focusedTrackIndex;

          const hasProgramInPresetList = GUITAR_MIDI_PROGRAMS.some(
            (p) => p.program === track.program
          );

          return (
            <div
              key={track.index}
              className={`track-card ${track.visible ? 'visible-track' : ''} ${
                isFocused ? 'focused-track' : ''
              } ${effectivelySilenced ? 'silenced-track' : ''}`}
            >
              <div className="track-card-top">
                <button
                  type="button"
                  className="btn-visibility"
                  onClick={() => onToggleTrackVisibility(track.index)}
                  title="Incluir/remover instrumento da visualização simultânea"
                >
                  {track.visible ? (
                    <CheckSquare size={15} className="icon-checked" />
                  ) : (
                    <SquareIcon size={15} className="icon-unchecked" />
                  )}
                </button>

                <button
                  type="button"
                  className="track-select-btn"
                  onClick={() => onSelectSingleTrack(track.index)}
                  title="Clique para focar apenas neste instrumento na partitura e no Braço Virtual"
                >
                  <Music size={15} className="track-icon" />
                  <div className="track-names">
                    <span className="track-name">{track.name}</span>
                    <span className="track-meta">
                      {track.isPercussion
                        ? 'Bateria / Percussão'
                        : `${track.tuning.length} cordas • ${track.shortName}`}
                    </span>
                  </div>
                </button>

                <div className="mute-solo-group">
                  <button
                    type="button"
                    className={`btn-ms mute ${track.muted ? 'active' : ''}`}
                    onClick={() => onToggleTrackMute(track.index)}
                    title={
                      track.muted
                        ? `Desmutar ${track.name} (Atalho: M)`
                        : `Mutar ${track.name} (Atalho: M)`
                    }
                  >
                    M
                  </button>
                  <button
                    type="button"
                    className={`btn-ms solo ${track.solo ? 'active' : ''}`}
                    onClick={() => onToggleTrackSolo(track.index)}
                    title={
                      track.solo
                        ? `Desativar Solo de ${track.name} (Atalho: S)`
                        : `Ouvir apenas ${track.name} (Atalho: S)`
                    }
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Per-Track Guitar/Bass Sound Selector */}
              {!track.isPercussion && (
                <div className="track-tone-row">
                  <select
                    className="track-tone-select"
                    value={track.program}
                    onChange={(e) =>
                      onChangeTrackProgram(track.index, Number(e.target.value))
                    }
                    title="Trocar o timbre/instrumento desta trilha (Distorção, Overdrive, Fuzz, Clean, Baixo)"
                  >
                    {!hasProgramInPresetList && (
                      <option value={track.program}>
                        🎵 Timbre Original do Arquivo (MIDI #{track.program})
                      </option>
                    )}
                    {GUITAR_MIDI_PROGRAMS.map((opt) => (
                      <option key={opt.program} value={opt.program}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="track-card-bottom">
                <button
                  type="button"
                  className="btn-vol-icon"
                  onClick={() => onToggleTrackMute(track.index)}
                  title={track.muted ? 'Mudo (clique para ativar)' : 'Clique para mutar'}
                >
                  {effectivelySilenced || track.volume === 0 ? (
                    <VolumeX size={14} className="text-danger" />
                  ) : track.solo ? (
                    <Headphones size={14} className="text-warning" />
                  ) : (
                    <Volume2 size={14} />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={track.volume}
                  onChange={(e) =>
                    onChangeTrackVolume(track.index, Number(e.target.value))
                  }
                  className="track-vol-slider"
                  title={`Volume de ${track.name}: ${Math.round(track.volume * 100)}%`}
                />
                <span className="track-vol-pct">
                  {Math.round(track.volume * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mixer-footer-tip">
        <p>
          <strong>Dica:</strong> Escolha o timbre de cada trilha acima e abra a{' '}
          <strong>Pedaleira (FX)</strong> no topo para Distorção, Fuzz, Delay e Reverb!
        </p>
      </div>
    </aside>
  );
};
