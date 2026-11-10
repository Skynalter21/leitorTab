// Single Responsibility Component: Interactive Guitar Amp & Pedalboard Effects Rack Bar

import React from 'react';
import type { DriveMode, GuitarFxConfig } from '../../domain/models';
import { GUITAR_FX_PRESETS } from '../../services/audio/WebAudioGuitarEffectsRack';
import { Zap, Speaker, Waves, Sparkles, Power } from 'lucide-react';

interface GuitarEffectsRackBarProps {
  config: GuitarFxConfig;
  onChangeConfig: (nextConfig: GuitarFxConfig) => void;
}

export const GuitarEffectsRackBar: React.FC<GuitarEffectsRackBarProps> = ({
  config,
  onChangeConfig,
}) => {
  const handleSelectPreset = (presetId: string) => {
    const found = GUITAR_FX_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    onChangeConfig({
      presetId: found.id,
      ...found.config,
    });
  };

  const updateField = <K extends keyof GuitarFxConfig>(
    key: K,
    val: GuitarFxConfig[K]
  ) => {
    onChangeConfig({
      ...config,
      presetId: 'custom',
      enabled: key === 'enabled' ? Boolean(val) : true,
      [key]: val,
    });
  };

  return (
    <div className={`fx-rack-bar ${config.enabled ? 'fx-active' : 'fx-bypassed'}`}>
      {/* Top Row: Power Switch & Studio Amp Presets */}
      <div className="fx-presets-row">
        <div className="fx-title-group">
          <button
            type="button"
            className={`btn-fx-power ${config.enabled ? 'on' : 'off'}`}
            onClick={() => updateField('enabled', !config.enabled)}
            title="Ligar/Desligar Pedaleira e Simulador de Amplificador"
          >
            <Power size={14} />
            <span>{config.enabled ? 'FX ON' : 'BYPASS'}</span>
          </button>

          <span className="fx-rack-label">
            <Sparkles size={14} className="text-indigo" /> Presets de Timbre:
          </span>
        </div>

        <div className="fx-preset-pills">
          {GUITAR_FX_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`fx-preset-btn ${
                config.presetId === preset.id ? 'active' : ''
              }`}
              onClick={() => handleSelectPreset(preset.id)}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Row: Individual Pedal Modules (Drive/Fuzz, Amp EQ & 4x12 Cab, Chorus/Delay/Reverb) */}
      <div className="fx-pedals-grid">
        {/* Module 1: Overdrive / Distortion / Fuzz Pedal */}
        <div className="fx-pedal-card drive">
          <div className="pedal-header">
            <Zap size={14} />
            <strong>Pedal de Drive / Fuzz</strong>
            <select
              value={config.driveMode}
              onChange={(e) => updateField('driveMode', e.target.value as DriveMode)}
              className="pedal-mode-select"
            >
              <option value="clean">Clean (Limpo)</option>
              <option value="overdrive">Tube Overdrive (TS9)</option>
              <option value="distortion">Heavy Distortion</option>
              <option value="fuzz">Vintage Fuzz (Big Muff)</option>
            </select>
          </div>

          <div className="pedal-sliders">
            <div className="pedal-knob-row">
              <span>Ganho (Drive):</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={config.driveAmount}
                onChange={(e) => updateField('driveAmount', Number(e.target.value))}
              />
              <strong>{Math.round(config.driveAmount * 100)}%</strong>
            </div>

            <div className="pedal-knob-row">
              <span>Simulador Caixa 4x12:</span>
              <button
                type="button"
                className={`btn-cab-toggle ${config.cabSimEnabled ? 'active' : ''}`}
                onClick={() => updateField('cabSimEnabled', !config.cabSimEnabled)}
                title="Simula a resposta acústica de um amplificador 4x12 microfonado, removendo a aspereza digital"
              >
                <Speaker size={12} />
                <span>{config.cabSimEnabled ? '4x12 Cab ATIVO' : 'Cab Desligado'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Module 2: 3-Band Amplifier Tone Stack (Bass, Mid, Treble) */}
        <div className="fx-pedal-card amp-eq">
          <div className="pedal-header">
            <Speaker size={14} />
            <strong>Equalizador do Amplificador</strong>
          </div>

          <div className="pedal-sliders">
            <div className="pedal-knob-row">
              <span>Grave (Bass):</span>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={config.bassDb}
                onChange={(e) => updateField('bassDb', Number(e.target.value))}
              />
              <strong>
                {config.bassDb > 0 ? `+${config.bassDb}` : config.bassDb} dB
              </strong>
            </div>

            <div className="pedal-knob-row">
              <span>Médio (Mid):</span>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={config.midDb}
                onChange={(e) => updateField('midDb', Number(e.target.value))}
              />
              <strong>
                {config.midDb > 0 ? `+${config.midDb}` : config.midDb} dB
              </strong>
            </div>

            <div className="pedal-knob-row">
              <span>Agudo (Treble):</span>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={config.trebleDb}
                onChange={(e) => updateField('trebleDb', Number(e.target.value))}
              />
              <strong>
                {config.trebleDb > 0 ? `+${config.trebleDb}` : config.trebleDb} dB
              </strong>
            </div>
          </div>
        </div>

        {/* Module 3: Chorus, Stereo Delay & Studio Hall Reverb */}
        <div className="fx-pedal-card ambience">
          <div className="pedal-header">
            <Waves size={14} />
            <strong>Chorus, Delay & Reverb de Estúdio</strong>
          </div>

          <div className="pedal-sliders">
            <div className="pedal-knob-row">
              <span>Chorus Estéreo:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.04}
                value={config.chorusMix}
                onChange={(e) => updateField('chorusMix', Number(e.target.value))}
              />
              <strong>{Math.round(config.chorusMix * 100)}%</strong>
            </div>

            <div className="pedal-knob-row">
              <span>Delay (Eco Mix):</span>
              <input
                type="range"
                min={0}
                max={0.75}
                step={0.03}
                value={config.delayMix}
                onChange={(e) => updateField('delayMix', Number(e.target.value))}
              />
              <strong>{Math.round(config.delayMix * 100)}%</strong>
            </div>

            <div className="pedal-knob-row">
              <span>Tempo do Delay:</span>
              <input
                type="range"
                min={0.12}
                max={0.68}
                step={0.02}
                value={config.delayTimeSec}
                onChange={(e) => updateField('delayTimeSec', Number(e.target.value))}
              />
              <strong>{Math.round(config.delayTimeSec * 1000)} ms</strong>
            </div>

            <div className="pedal-knob-row">
              <span>Reverb (Hall):</span>
              <input
                type="range"
                min={0}
                max={0.75}
                step={0.03}
                value={config.reverbMix}
                onChange={(e) => updateField('reverbMix', Number(e.target.value))}
              />
              <strong>{Math.round(config.reverbMix * 100)}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

