// ChromaticTuner Component (SRP, ISP, DIP)
// Delegates pitch detection math to IPitchDetector and reference tone synthesis to IReferenceToneGenerator.

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import type {
  IPitchDetector,
  IReferenceToneGenerator,
} from '../domain/contracts';
import {
  AutocorrelationPitchDetector,
  WebAudioReferenceToneGenerator,
} from '../services/audio/WebAudioEngine';

interface ChromaticTunerProps {
  isOpen: boolean;
  onClose: () => void;
  pitchDetector?: IPitchDetector;
  toneGenerator?: IReferenceToneGenerator;
}

const GUITAR_REF_STRINGS = [
  { label: '6ª (E2)', freq: 82.41 },
  { label: '5ª (A2)', freq: 110.0 },
  { label: '4ª (D3)', freq: 146.83 },
  { label: '3ª (G3)', freq: 196.0 },
  { label: '2ª (B3)', freq: 246.94 },
  { label: '1ª (E4)', freq: 329.63 },
];

const defaultPitchDetector = new AutocorrelationPitchDetector();
const defaultToneGenerator = new WebAudioReferenceToneGenerator();

export const ChromaticTuner: React.FC<ChromaticTunerProps> = ({
  isOpen,
  onClose,
  pitchDetector = defaultPitchDetector,
  toneGenerator = defaultToneGenerator,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('--');
  const [detectedOctave, setDetectedOctave] = useState<string>('');
  const [detectedFreq, setDetectedFreq] = useState<number>(0);
  const [centsOff, setCentsOff] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopMicrophone = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopMicrophone();
    }
    return () => stopMicrophone();
  }, [isOpen]);

  const startMicrophone = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
      streamRef.current = stream;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      setIsListening(true);

      const updatePitch = () => {
        analyser.getFloatTimeDomainData(buffer);
        const result = pitchDetector.detectPitch(buffer, ctx.sampleRate);

        if (result) {
          setDetectedNote(result.noteName);
          setDetectedOctave(String(result.octave));
          setDetectedFreq(result.frequency);
          setCentsOff(result.centsOff);
        }

        rafRef.current = requestAnimationFrame(updatePitch);
      };

      rafRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      setMicError(
        err instanceof Error
          ? `Permissão de microfone negada ou indisponível (${err.message}).`
          : 'Não foi possível acessar o microfone.'
      );
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  const isInTune = detectedNote !== '--' && Math.abs(centsOff) <= 5;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="tuner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2>Afinador Cromático (440 Hz)</h2>
            <p>Afine pelo microfone ou ouça o tom de referência de cada corda</p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tuner-body">
          {micError && <div className="error-banner">{micError}</div>}

          <div className={`tuner-display ${isInTune ? 'in-tune' : ''}`}>
            <div className="tuner-note-row">
              <span className="tuner-note">{detectedNote}</span>
              <span className="tuner-octave">{detectedOctave}</span>
            </div>
            <div className="tuner-freq">
              {detectedFreq > 0 ? `${detectedFreq} Hz` : 'Toque uma corda...'}
            </div>

            <div className="tuner-meter-track">
              <div className="tuner-center-mark" />
              <div
                className={`tuner-needle ${isInTune ? 'in-tune' : ''}`}
                style={{
                  left: `${50 + centsOff}%`,
                }}
              />
            </div>
            <div className="tuner-cents-labels">
              <span>-50c (Baixo)</span>
              <span className={isInTune ? 'text-tune-ok' : ''}>
                {detectedNote !== '--'
                  ? isInTune
                    ? '✓ AFINADO'
                    : `${centsOff > 0 ? '+' : ''}${centsOff} cents`
                  : '0c'}
              </span>
              <span>+50c (Alto)</span>
            </div>
          </div>

          <button
            type="button"
            className={`btn-tuner-mic ${isListening ? 'active' : ''}`}
            onClick={isListening ? stopMicrophone : startMicrophone}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            <span>
              {isListening ? 'Desligar Microfone' : 'Ativar Microfone para Afinar'}
            </span>
          </button>

          <div className="tuner-ref-section">
            <span className="ref-title">
              <Volume2 size={14} /> Diapasão (Clique para ouvir o som da corda):
            </span>
            <div className="ref-buttons-grid">
              {GUITAR_REF_STRINGS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="btn-ref-tone"
                  onClick={() => toneGenerator.playTone(s.freq)}
                >
                  <strong>{s.label}</strong>
                  <span>{s.freq} Hz</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
