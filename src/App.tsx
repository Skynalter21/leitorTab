// App Shell Component (SRP & DIP)
// Coordinates top-level layout, drag-and-drop, and modals while delegating
// persistence and document state management to useLibraryManager.

import React, { useState, useRef } from 'react';
import { GuitarProPlayer } from './components/GuitarProPlayer';
import { PdfViewer } from './components/PdfViewer';
import { LibraryDrawer } from './components/LibraryDrawer';
import { ChromaticTuner } from './components/ChromaticTuner';
import { FreeCatalogModal } from './components/FreeCatalogModal';
import { LiveTabSearchBar } from './components/LiveTabSearchBar';
import { BUILTIN_CATALOG } from './data/demoSong';
import { useLibraryManager } from './hooks/useLibraryManager';
import {
  FolderOpen,
  Music2,
  FileText,
  Sparkles,
  UploadCloud,
  BookOpen,
  Radio,
  Globe,
} from 'lucide-react';
import './App.css';

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);

  const {
    libraryItems,
    currentDoc,
    fileError,
    setFileError,
    selectLibraryItem,
    loadBufferIntoLibraryAndPlayer,
    processFile,
    selectBuiltInSong,
    loadCustomAlphaTex,
    saveCurrentSongSettings,
    saveCurrentSongMetadata,
    toggleFavorite,
    changeStatus,
    deleteItem,
  } = useLibraryManager();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div
      className="app-shell"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="dropzone-overlay">
          <div className="dropzone-card">
            <UploadCloud size={48} />
            <h2>Solte sua tablatura aqui</h2>
            <p>Suporta Guitar Pro (.gp, .gp3, .gp4, .gp5, .gpx) e arquivos PDF (.pdf)</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="brand-group">
          <div className="brand-logo">
            <Music2 size={22} />
          </div>
          <div>
            <h1 className="brand-title">LeitorTab Studio</h1>
            <span className="brand-subtitle">
              Guitar Pro & PDF • Mixer, Speed Trainer, Braço Virtual & Catálogo Gratuito
            </span>
          </div>
        </div>

        <LiveTabSearchBar
          onSelectBuiltIn={selectBuiltInSong}
          onLoadRemoteBuffer={loadBufferIntoLibraryAndPlayer}
        />

        <div className="open-tabs-strip">
          {BUILTIN_CATALOG.slice(0, 3).map((song) => (
            <button
              key={song.id}
              type="button"
              className={`tab-pill ${currentDoc.id === song.id ? 'active' : ''}`}
              onClick={() => selectBuiltInSong(song)}
              title={`${song.title} (${song.genre})`}
            >
              <Sparkles size={13} className="pill-icon gp" />
              <span className="pill-name">{song.title}</span>
            </button>
          ))}

          {libraryItems.slice(0, 5).map((item) => {
            const active = item.id === currentDoc.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`tab-pill ${active ? 'active' : ''}`}
                onClick={() => selectLibraryItem(item)}
                title={`Alternar para ${item.fileName}`}
              >
                {item.kind === 'pdf' ? (
                  <FileText size={14} className="pill-icon pdf" />
                ) : (
                  <Music2 size={14} className="pill-icon gp" />
                )}
                <span className="pill-name">{item.title || item.fileName}</span>
              </button>
            );
          })}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-catalog-online"
            onClick={() => setIsCatalogOpen(true)}
            title="Explorar tablaturas gratuitas online (GitHub .GP5/.PDF), Jams integradas, URL e AlphaTex"
          >
            <Globe size={16} />
            <span>Catálogo Gratuito</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsTunerOpen(true)}
            title="Abrir Afinador Cromático via Microfone e Diapasão"
          >
            <Radio size={16} />
            <span>Afinador</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsLibraryOpen(true)}
            title="Abrir Biblioteca Salva no Navegador (IndexedDB)"
          >
            <BookOpen size={16} />
            <span>Biblioteca ({libraryItems.length})</span>
          </button>

          <button
            type="button"
            className="btn-primary-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={17} />
            <span>Abrir (.GP / .PDF)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp7,.gp8,.pdf,.musicxml,.xml,.mxl,.cap"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </header>

      {fileError && (
        <div className="global-error-bar">
          <span>{fileError}</span>
          <button type="button" onClick={() => setFileError(null)}>
            Fechar
          </button>
        </div>
      )}

      <main className="app-main">
        {currentDoc.kind === 'gp' ? (
          <GuitarProPlayer
            key={currentDoc.id}
            source={currentDoc.source}
            initialSettings={currentDoc.settings}
            onSaveSettings={saveCurrentSongSettings}
            onMetadataLoaded={saveCurrentSongMetadata}
          />
        ) : (
          <PdfViewer
            key={currentDoc.id}
            fileData={currentDoc.buffer}
            fileName={currentDoc.fileName}
          />
        )}
      </main>

      <LibraryDrawer
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        items={libraryItems}
        activeId={currentDoc.id}
        onSelect={selectLibraryItem}
        onToggleFavorite={toggleFavorite}
        onChangeStatus={changeStatus}
        onDelete={deleteItem}
        onOpenFilePicker={() => fileInputRef.current?.click()}
      />

      <FreeCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectBuiltIn={selectBuiltInSong}
        onLoadRemoteBuffer={loadBufferIntoLibraryAndPlayer}
        onLoadCustomAlphaTex={loadCustomAlphaTex}
      />

      <ChromaticTuner
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
      />
    </div>
  );
}

export default App;
