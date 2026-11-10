// PdfViewer Component (SRP & DIP)
// Delegates auto-scrolling to useAutoScroll hook and metronome audio synthesis to IMetronomeEngine.

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  ArrowUpToLine,
  Timer,
  FileText,
  Gauge,
} from 'lucide-react';
import { useAutoScroll } from '../hooks/useAutoScroll';
import type { IMetronomeEngine } from '../domain/contracts';
import { WebAudioMetronomeEngine } from '../services/audio/WebAudioEngine';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
  fileData: ArrayBuffer;
  fileName: string;
  metronomeEngine?: IMetronomeEngine;
}

const defaultMetronome = new WebAudioMetronomeEngine();

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileData,
  fileName,
  metronomeEngine = defaultMetronome,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pagesContainerRef = useRef<HTMLDivElement | null>(null);

  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isAutoScrolling,
    setIsAutoScrolling,
    scrollSpeed,
    setScrollSpeed,
    scrollToTop,
  } = useAutoScroll(scrollContainerRef, 3);

  const [metronomeOn, setMetronomeOn] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(100);

  // Render PDF pages whenever fileData or scale changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const renderPdf = async () => {
      try {
        const clonedBuffer = fileData.slice(0);
        const loadingTask = pdfjsLib.getDocument({ data: clonedBuffer });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;
        setNumPages(pdf.numPages);

        const container = pagesContainerRef.current;
        if (!container) return;
        container.innerHTML = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (isCancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'pdf-page-card';

          const badge = document.createElement('div');
          badge.className = 'pdf-page-badge';
          badge.textContent = `Página ${pageNum} de ${pdf.numPages}`;

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const outputScale = window.devicePixelRatio || 1;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          pageWrapper.appendChild(badge);
          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);

          if (context) {
            const transform =
              outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
            await page.render({
              canvasContext: context,
              transform,
              viewport,
              canvas,
            }).promise;
          }
        }

        if (!isCancelled) {
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('PDF render error:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível renderizar o arquivo PDF.'
          );
          setIsLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      isCancelled = true;
    };
  }, [fileData, scale]);

  // Delegate metronome playback to injected IMetronomeEngine (DIP)
  useEffect(() => {
    if (metronomeOn) {
      metronomeEngine.start(bpm);
    } else {
      metronomeEngine.stop();
    }
    return () => metronomeEngine.stop();
  }, [metronomeOn, bpm, metronomeEngine]);

  return (
    <div className="pdf-workspace">
      <div className="gp-toolbar">
        <div className="toolbar-section">
          <div className="pdf-file-badge">
            <FileText size={16} />
            <span className="pdf-filename">{fileName}</span>
            {numPages > 0 && (
              <span className="pdf-page-count">({numPages} pág.)</span>
            )}
          </div>

          <div className="divider-v" />

          <button
            type="button"
            className={`btn-transport play ${isAutoScrolling ? 'active' : ''}`}
            onClick={() => setIsAutoScrolling((v) => !v)}
            title="Iniciar/Pausar rolagem automática da página para tocar sem usar as mãos"
          >
            {isAutoScrolling ? <Pause size={17} /> : <Play size={17} />}
            <span>{isAutoScrolling ? 'Pausar Rolagem' : 'Auto-Scroll'}</span>
          </button>

          <div className="speed-control" title="Velocidade da rolagem automática">
            <Gauge size={15} className="icon-muted" />
            <span className="range-label">Vel. Rolagem:</span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="vol-slider"
            />
            <span className="bpm-badge">{scrollSpeed}x</span>
          </div>

          <button
            type="button"
            className="btn-tool"
            onClick={scrollToTop}
            title="Voltar para o topo do PDF"
          >
            <ArrowUpToLine size={15} />
            <span>Topo</span>
          </button>
        </div>

        <div className="toolbar-section">
          <button
            type="button"
            className={`btn-tool ${metronomeOn ? 'active' : ''}`}
            onClick={() => setMetronomeOn((v) => !v)}
            title="Ativar metrônomo de apoio para estudar o PDF"
          >
            <Timer size={16} />
            <span>Metrônomo</span>
          </button>

          <div className="bar-range-picker">
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) =>
                setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 100)))
              }
              className="bar-input"
            />
            <span className="range-label">BPM</span>
          </div>

          <div className="divider-v" />

          <div className="zoom-controls">
            <button
              type="button"
              className="btn-icon"
              onClick={() =>
                setScale((s) => Math.max(0.6, Math.round((s - 0.15) * 100) / 100))
              }
              title="Diminuir Zoom do PDF"
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-text">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              className="btn-icon"
              onClick={() =>
                setScale((s) => Math.min(2.5, Math.round((s + 0.15) * 100) / 100))
              }
              title="Aumentar Zoom do PDF"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="pdf-scroll-viewport" ref={scrollContainerRef}>
        {error && (
          <div className="error-banner">
            <strong>Erro ao abrir PDF:</strong> {error}
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Renderizando páginas do PDF...</p>
          </div>
        )}

        <div ref={pagesContainerRef} className="pdf-pages-list" />
      </div>
    </div>
  );
};
