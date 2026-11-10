import React from 'react';

export interface ActiveFretNote {
  stringIndex: number; // 0 = top string (1st string), numStrings - 1 = bottom string
  fret: number; // 0 to 24
  trackIndex: number;
}

interface FretboardVisualizerProps {
  trackName: string;
  tuningPitches: number[]; // MIDI pitch of each string from top (1st) to bottom (6th)
  transposeSemitones: number;
  activeNotes: ActiveFretNote[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FRET_COUNT = 24;
const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_DOT_FRETS = new Set([12, 24]);

function midiToNoteName(midi: number): string {
  const normalized = ((midi % 12) + 12) % 12;
  return NOTE_NAMES[normalized];
}

export const FretboardVisualizer: React.FC<FretboardVisualizerProps> = ({
  trackName,
  tuningPitches,
  transposeSemitones,
  activeNotes,
}) => {
  const pitches =
    tuningPitches.length > 0 ? tuningPitches : [64, 59, 55, 50, 45, 40];
  const frets = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i);

  return (
    <div className="fretboard-panel">
      <div className="fretboard-header">
        <div className="fretboard-title">
          <strong>Braço em Tempo Real:</strong> <span>{trackName}</span>
          {transposeSemitones !== 0 && (
            <span className="transpose-pill">
              Tom: {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones} st
            </span>
          )}
        </div>
        <div className="fretboard-legend">
          <span>
            Notas ativas:{' '}
            {activeNotes.length > 0
              ? activeNotes
                  .map((n) => {
                    const basePitch = pitches[n.stringIndex] ?? 64;
                    const noteName = midiToNoteName(
                      basePitch + n.fret + transposeSemitones
                    );
                    return `${noteName} (casa ${n.fret})`;
                  })
                  .join(' • ')
              : 'Nenhuma nota tocando no momento'}
          </span>
        </div>
      </div>

      <div className="fretboard-scroll">
        <div className="fretboard-neck">
          {/* Fret Numbers Header Row */}
          <div className="fretboard-numbers-row">
            {frets.map((fret) => (
              <div
                key={`num-${fret}`}
                className={`fret-number-cell ${fret === 0 ? 'nut-col' : ''} ${
                  SINGLE_DOT_FRETS.has(fret) || DOUBLE_DOT_FRETS.has(fret)
                    ? 'marked-fret'
                    : ''
                }`}
              >
                {fret === 0 ? 'Solta' : fret}
              </div>
            ))}
          </div>

          {/* Strings Rows */}
          <div className="fretboard-strings-body">
            {pitches.map((openMidi, stringIdx) => {
              const transposedOpen = openMidi + transposeSemitones;
              const openNoteLabel = midiToNoteName(transposedOpen);
              const gaugePx = 1.2 + (stringIdx / Math.max(1, pitches.length - 1)) * 2.2;

              return (
                <div key={`str-${stringIdx}`} className="fret-string-row">
                  {frets.map((fret) => {
                    const isHit = activeNotes.some(
                      (n) => n.stringIndex === stringIdx && n.fret === fret
                    );
                    const noteName = midiToNoteName(transposedOpen + fret);

                    return (
                      <div
                        key={`cell-${stringIdx}-${fret}`}
                        className={`fret-cell ${fret === 0 ? 'nut-cell' : ''}`}
                      >
                        {/* Horizontal Guitar String Wire */}
                        <div
                          className={`string-wire ${isHit ? 'vibrating' : ''}`}
                          style={{ height: `${gaugePx}px` }}
                        />

                        {fret === 0 && !isHit && (
                          <span className="open-string-label">{openNoteLabel}</span>
                        )}

                        {isHit && (
                          <div className="fret-active-dot" title={`${noteName} (Casa ${fret})`}>
                            <span className="dot-note">{noteName}</span>
                            <span className="dot-fret">{fret}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Inlay Dots Row */}
            <div className="fretboard-inlays-row">
              {frets.map((fret) => (
                <div
                  key={`inlay-${fret}`}
                  className={`fret-inlay-cell ${fret === 0 ? 'nut-col' : ''}`}
                >
                  {SINGLE_DOT_FRETS.has(fret) && <span className="inlay-dot" />}
                  {DOUBLE_DOT_FRETS.has(fret) && (
                    <div className="inlay-double">
                      <span className="inlay-dot" />
                      <span className="inlay-dot" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

