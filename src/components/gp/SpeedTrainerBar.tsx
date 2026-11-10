// Single Responsibility Component: Progressive Loop Speed Trainer Control Bar

import React from 'react';
import { Flame } from 'lucide-react';

interface SpeedTrainerBarProps {
  active: boolean;
  startSpeed: number;
  targetSpeed: number;
  stepPct: number;
  everyLoops: number;
  loopCounter: number;
  currentPlaybackSpeed: number;
  onChangeStartSpeed: (val: number) => void;
  onChangeTargetSpeed: (val: number) => void;
  onChangeStepPct: (val: number) => void;
  onChangeEveryLoops: (val: number) => void;
  onToggleActive: () => void;
}

export const SpeedTrainerBar: React.FC<SpeedTrainerBarProps> = ({
  active,
  startSpeed,
  targetSpeed,
  stepPct,
  everyLoops,
  loopCounter,
  currentPlaybackSpeed,
  onChangeStartSpeed,
  onChangeTargetSpeed,
  onChangeStepPct,
  onChangeEveryLoops,
  onToggleActive,
}) => {
  return (
    <div className="speed-trainer-bar">
      <div className="trainer-info">
        <Flame size={16} className="text-warning" />
        <strong>Speed Trainer (Acelerador Progressivo):</strong>
        <span>Aumenta automaticamente a velocidade a cada volta do Loop A-B.</span>
      </div>

      <div className="trainer-controls">
        <label>
          Início:
          <select
            value={startSpeed}
            onChange={(e) => onChangeStartSpeed(Number(e.target.value))}
          >
            <option value={0.4}>40%</option>
            <option value={0.5}>50%</option>
            <option value={0.6}>60%</option>
            <option value={0.7}>70%</option>
            <option value={0.75}>75%</option>
            <option value={0.8}>80%</option>
          </select>
        </label>

        <label>
          Alvo:
          <select
            value={targetSpeed}
            onChange={(e) => onChangeTargetSpeed(Number(e.target.value))}
          >
            <option value={0.85}>85%</option>
            <option value={0.9}>90%</option>
            <option value={1.0}>100%</option>
            <option value={1.1}>110%</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
          </select>
        </label>

        <label>
          Incremento:
          <select
            value={stepPct}
            onChange={(e) => onChangeStepPct(Number(e.target.value))}
          >
            <option value={0.02}>+2%</option>
            <option value={0.05}>+5%</option>
            <option value={0.1}>+10%</option>
          </select>
        </label>

        <label>
          A cada:
          <select
            value={everyLoops}
            onChange={(e) => onChangeEveryLoops(Number(e.target.value))}
          >
            <option value={1}>1 volta</option>
            <option value={2}>2 voltas</option>
            <option value={3}>3 voltas</option>
            <option value={4}>4 voltas</option>
          </select>
        </label>

        {active && (
          <span className="trainer-status-pill">
            Volta {loopCounter + 1}/{everyLoops} • Atual:{' '}
            {Math.round(currentPlaybackSpeed * 100)}% → Alvo:{' '}
            {Math.round(targetSpeed * 100)}%
          </span>
        )}

        <button
          type="button"
          className={`btn-trainer-toggle ${active ? 'active' : ''}`}
          onClick={onToggleActive}
        >
          {active ? 'Desativar Speed Trainer' : 'Iniciar Speed Trainer'}
        </button>
      </div>
    </div>
  );
};

