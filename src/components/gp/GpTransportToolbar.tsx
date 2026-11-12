// Single Responsibility Component: Top Transport, Speed, Loop A-B, Transpose & View Toolbar

import React from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  Gauge,
  ZoomIn,
  ZoomOut,
  Timer,
  Sliders,
  Layers,
  Flame,
  Moon,
  Sun,
  Guitar,
  ArrowUpDown,
  Zap,
  Bookmark,
} from 'lucide-react';

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface GpTransportToolbarProps {
  trackCount: number;
  showMixer: boolean;
  onToggleMixer: () => void;
  playerReady: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTime: number;
  endTime: number;
  currentTick: number;
  endTick: number;
  onSeekTick: (tick: number) => void;
  playbackSpeed: number;
  effectiveBpm: number;
  onSpeedChange: (speed: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  totalBars: number;
  loopStartBar: number;
  loopEndBar: number;
  onChangeLoopStartBar: (bar: number) => void;
  onChangeLoopEndBar: (bar: number) => void;
  onApplyBarLoopRange: () => void;
  hasActiveRange: boolean;
  onClearLoopRange: () => void;
  showSpeedTrainer: boolean;
  speedTrainerActive: boolean;
  onToggleShowSpeedTrainer: () => void;
  transposeSemitones: number;
  onTransposeChange: (delta: number) => void;
  showFxRack: boolean;
  fxEnabled: boolean;
  onToggleShowFxRack: () => void;
  showSectionsBar: boolean;
  sectionCount: number;
  onToggleShowSectionsBar: () => void;
  showFretboard: boolean;
  onToggleFretboard: () => void;
  darkScore: boolean;
  onToggleDarkScore: () => void;
  metronomeEnabled: boolean;
  onToggleMetronome: () => void;
  countInEnabled: boolean;
  onToggleCountIn: () => void;
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
  zoomScale: number;
  onZoomChange: (delta: number) => void;
  layoutMode: 'page' | 'horizontal';
  onToggleLayout: () => void;
}

export const GpTransportToolbar: React.FC<GpTransportToolbarProps> = ({
  trackCount,
  showMixer,
  onToggleMixer,
  playerReady,
  isPlaying,
  onPlayPause,
  onStop,
  currentTime,
  endTime,
  currentTick,
  endTick,
  onSeekTick,
  playbackSpeed,
  effectiveBpm,
  onSpeedChange,
  isLooping,
  onToggleLoop,
  totalBars,
  loopStartBar,
  loopEndBar,
  onChangeLoopStartBar,
  onChangeLoopEndBar,
  onApplyBarLoopRange,
  hasActiveRange,
  onClearLoopRange,
  showSpeedTrainer,
  speedTrainerActive,
  onToggleShowSpeedTrainer,
  transposeSemitones,
  onTransposeChange,
  showFxRack,
  fxEnabled,
  onToggleShowFxRack,
  showSectionsBar,
  sectionCount,
  onToggleShowSectionsBar,
  showFretboard,
  onToggleFretboard,
  darkScore,
  onToggleDarkScore,
  metronomeEnabled,
  onToggleMetronome,
  countInEnabled,
  onToggleCountIn,
  masterVolume,
  onMasterVolumeChange,
  zoomScale,
  onZoomChange,
  layoutMode,
  onToggleLayout,
}) => {
  return (
    <div className="gp-toolbar">
      {/* Group 1: Mixer Toggle & Transport */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`btn-tool ${showMixer ? 'active' : ''}`}
          onClick={onToggleMixer}
          title="Mostrar/Ocultar Mixer de Instrumentos"
        >
          <Sliders size={15} />
          <span>Instrumentos ({trackCount})</span>
        </button>

        <div className="divider-v" />

        <button
          type="button"
          className="btn-transport play"
          onClick={onPlayPause}
          disabled={!playerReady}
          title={
            playerReady
              ? 'Tocar / Pausar (Atalho: Espaço)'
              : 'Carregando sintetizador de áudio...'
          }
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          <span>{isPlaying ? 'Pausar' : 'Tocar'}</span>
        </button>

        <button
          type="button"
          className="btn-transport"
          onClick={onStop}
          disabled={!playerReady}
          title="Parar e voltar ao início"
        >
          <Square size={15} />
        </button>

        <div className="time-seek-wrapper">
          <span className="time-label">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="seek-slider"
            min={0}
            max={endTick || 100}
            value={currentTick}
            onChange={(e) => onSeekTick(Number(e.target.value))}
            disabled={!playerReady}
          />
          <span className="time-label">{formatTime(endTime)}</span>
        </div>
      </div>

      {/* Group 2: Speed, Loop A-B, Speed Trainer & Pitch Transpose */}
      <div className="toolbar-section">
        <div className="speed-control" title="Velocidade de reprodução e BPM efetivo">
          <Gauge size={15} className="icon-muted" />
          <select
            className="speed-select"
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          >
            <option value={0.25}>25%</option>
            <option value={0.5}>50%</option>
            <option value={0.6}>60%</option>
            <option value={0.7}>70%</option>
            <option value={0.75}>75%</option>
            <option value={0.8}>80%</option>
            <option value={0.85}>85%</option>
            <option value={0.9}>90%</option>
            <option value={0.95}>95%</option>
            <option value={1}>100%</option>
            <option value={1.1}>110%</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
          </select>
          <span className="bpm-badge">{effectiveBpm} BPM</span>
        </div>

        {/* Loop A-B Controls */}
        <div className="loop-controls">
          <button
            type="button"
            className={`btn-tool ${isLooping ? 'active' : ''}`}
            onClick={onToggleLoop}
            title="Ativar/Desativar repetição em Loop (Atalho: L)"
          >
            <Repeat size={15} />
            <span>Loop</span>
          </button>

          {totalBars > 0 && (
            <div className="bar-range-picker" title="Selecionar compassos para Loop (A-B)">
              <span className="range-label">Comp.</span>
              <input
                type="number"
                min={1}
                max={totalBars}
                value={loopStartBar}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(totalBars, Number(e.target.value) || 1));
                  onChangeLoopStartBar(val);
                }}
                className="bar-input"
              />
              <span className="range-label">-</span>
              <input
                type="number"
                min={loopStartBar}
                max={totalBars}
                value={loopEndBar}
                onChange={(e) => {
                  const val = Math.max(
                    loopStartBar,
                    Math.min(totalBars, Number(e.target.value) || loopStartBar)
                  );
                  onChangeLoopEndBar(val);
                }}
                className="bar-input"
              />
              <button
                type="button"
                className="btn-mini"
                onClick={onApplyBarLoopRange}
                title="Aplicar trecho A-B nos compassos escolhidos"
              >
                A-B
              </button>
              {hasActiveRange && (
                <button
                  type="button"
                  className="btn-mini clear"
                  onClick={onClearLoopRange}
                  title="Limpar seleção de trecho"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className={`btn-tool ${
              speedTrainerActive ? 'trainer-running' : showSpeedTrainer ? 'active' : ''
            }`}
            onClick={onToggleShowSpeedTrainer}
            title="Abrir Speed Trainer (Acelerador Progressivo no Loop)"
          >
            <Flame size={15} />
            <span>
              {speedTrainerActive
                ? `Trainer (${Math.round(playbackSpeed * 100)}%)`
                : 'Speed Trainer'}
            </span>
          </button>
        </div>

        <div className="divider-v" />

        {/* Pitch Transpose (-6 to +6 semitones) */}
        <div className="bar-range-picker" title="Transpor afinação em semitons">
          <ArrowUpDown size={14} className="icon-muted" />
          <span className="range-label">Tom:</span>
          <button
            type="button"
            className="btn-xs"
            onClick={() => onTransposeChange(-1)}
            disabled={transposeSemitones <= -6}
          >
            -1
          </button>
          <span className="bpm-badge">
            {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones} st
          </span>
          <button
            type="button"
            className="btn-xs"
            onClick={() => onTransposeChange(1)}
            disabled={transposeSemitones >= 6}
          >
            +1
          </button>
        </div>
      </div>

      {/* Group 3: Sections Bar, FX Pedalboard, Fretboard, Dark Mode, Metronome, Volume & Zoom */}
      <div className="toolbar-section">
        <button
          type="button"
          className={`btn-tool ${showSectionsBar ? 'active' : ''}`}
          onClick={onToggleShowSectionsBar}
          title="Mostrar/Ocultar Abas de Partes da Música (Introdução, Verso, Ponte, Solo, Refrão)"
        >
          <Bookmark size={15} />
          <span>Partes ({sectionCount})</span>
        </button>

        <button
          type="button"
          className={`btn-tool ${
            fxEnabled ? 'fx-running' : showFxRack ? 'active' : ''
          }`}
          onClick={onToggleShowFxRack}
          title="Abrir Pedaleira & Amplificador (Distorção, Fuzz, Gabinete 4x12, Chorus, Delay e Reverb)"
        >
          <Zap size={15} />
          <span>{fxEnabled ? 'Pedaleira (ON)' : 'Pedaleira (FX)'}</span>
        </button>

        <button
          type="button"
          className={`btn-tool ${showFretboard ? 'active' : ''}`}
          onClick={onToggleFretboard}
          title="Mostrar/Ocultar Braço Interativo (Fretboard) em tempo real"
        >
          <Guitar size={15} />
          <span>Braço</span>
        </button>

        <button
          type="button"
          className={`btn-tool ${darkScore ? 'active' : ''}`}
          onClick={onToggleDarkScore}
          title="Alternar Modo Noturno na Folha da Partitura"
        >
          {darkScore ? <Sun size={15} /> : <Moon size={15} />}
          <span>{darkScore ? 'Folha Clara' : 'Modo Noturno'}</span>
        </button>

        <button
          type="button"
          className={`btn-tool ${metronomeEnabled ? 'active' : ''}`}
          onClick={onToggleMetronome}
          title="Ativar/Desativar Metrônomo"
        >
          <Timer size={15} />
        </button>

        <button
          type="button"
          className={`btn-tool ${countInEnabled ? 'active' : ''}`}
          onClick={onToggleCountIn}
          title="Contagem regressiva (Count-in) antes de tocar"
        >
          <span>1-2-3-4</span>
        </button>

        <div className="master-volume" title={`Volume Geral: ${Math.round(masterVolume * 100)}%`}>
          {masterVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
            className="vol-slider"
          />
        </div>

        <div className="zoom-controls">
          <button
            type="button"
            className="btn-icon"
            onClick={() => onZoomChange(-0.1)}
            title="Diminuir Zoom"
          >
            <ZoomOut size={15} />
          </button>
          <span className="zoom-text">{Math.round(zoomScale * 100)}%</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => onZoomChange(0.1)}
            title="Aumentar Zoom"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className="btn-tool"
            onClick={onToggleLayout}
            title={
              layoutMode === 'page'
                ? 'Modo Página Vertical (clique para Horizontal)'
                : 'Modo Horizontal (clique para Página Vertical)'
            }
          >
            <Layers size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
