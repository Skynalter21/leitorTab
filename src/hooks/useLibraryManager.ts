// Single Responsibility & Dependency Inversion Hook:
// Manages active document state and persistent library operations via ITablatureRepository.

import { useState, useEffect, useCallback } from 'react';
import type { ITablatureRepository } from '../domain/contracts';
import type {
  LibraryItem,
  LoadedDocument,
  SavedSongSettings,
  StudyStatus,
} from '../domain/models';
import { defaultTablatureRepository } from '../services/libraryDb';
import { DEMO_ALPHATEX, type BuiltInCatalogSong } from '../data/demoSong';

const GP_EXTENSIONS = [
  '.gp',
  '.gp3',
  '.gp4',
  '.gp5',
  '.gpx',
  '.gp7',
  '.gp8',
  '.musicxml',
  '.xml',
  '.mxl',
  '.cap',
];

const DEFAULT_DEMO_DOC: LoadedDocument = {
  id: 'catalog-rock-em',
  kind: 'gp',
  fileName: 'Rock Jam em Mi Menor',
  source: {
    type: 'tex',
    data: DEMO_ALPHATEX,
    fileName: 'Rock Jam em Mi Menor',
  },
};

function mapLibraryItemToLoadedDocument(item: LibraryItem): LoadedDocument {
  if (item.kind === 'pdf') {
    return {
      id: item.id,
      kind: 'pdf',
      fileName: item.fileName,
      buffer: item.data,
      settings: item.settings,
    };
  }
  return {
    id: item.id,
    kind: 'gp',
    fileName: item.fileName,
    source: {
      type: 'file',
      data: item.data,
      fileName: item.fileName,
    },
    settings: item.settings,
  };
}

export function useLibraryManager(
  repository: ITablatureRepository = defaultTablatureRepository
) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [currentDoc, setCurrentDoc] = useState<LoadedDocument>(DEFAULT_DEMO_DOC);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    repository
      .getAll()
      .then((items) => {
        setLibraryItems(items);
        if (items.length > 0) {
          setCurrentDoc(mapLibraryItemToLoadedDocument(items[0]));
        }
      })
      .catch((err) => {
        console.error('Failed to load tablature repository:', err);
      });
  }, [repository]);

  const selectLibraryItem = useCallback(
    async (item: LibraryItem) => {
      setCurrentDoc(mapLibraryItemToLoadedDocument(item));
      const updated = await repository.updateMeta(item.id, {
        lastOpenedAt: Date.now(),
      });
      if (updated) {
        setLibraryItems((prev) => [
          updated,
          ...prev.filter((i) => i.id !== item.id),
        ]);
      }
    },
    [repository]
  );

  const loadBufferIntoLibraryAndPlayer = useCallback(
    async (fileName: string, arrayBuffer: ArrayBuffer) => {
      setFileError(null);
      const lowerName = fileName.toLowerCase();
      const isPdf = lowerName.endsWith('.pdf');
      const isGp = GP_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

      if (!isPdf && !isGp) {
        setFileError(
          `Formato não suportado ("${fileName}"). Use arquivos Guitar Pro (.gp, .gp3, .gp4, .gp5, .gpx, .mxl) ou .pdf.`
        );
        return;
      }

      const docId = `tab-${fileName}-${arrayBuffer.byteLength}`;
      const now = Date.now();
      const existing = libraryItems.find((i) => i.id === docId);

      const libItem: LibraryItem = {
        id: docId,
        fileName,
        title: existing?.title,
        artist: existing?.artist,
        kind: isPdf ? 'pdf' : 'gp',
        data: arrayBuffer,
        addedAt: existing?.addedAt ?? now,
        lastOpenedAt: now,
        favorite: existing?.favorite ?? false,
        status: existing?.status ?? 'studying',
        settings: existing?.settings,
      };

      await repository.save(libItem);
      setLibraryItems((prev) => [
        libItem,
        ...prev.filter((i) => i.id !== docId),
      ]);
      setCurrentDoc(mapLibraryItemToLoadedDocument(libItem));
    },
    [libraryItems, repository]
  );

  const processFile = useCallback(
    async (file: File) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        await loadBufferIntoLibraryAndPlayer(file.name, arrayBuffer);
      } catch (err) {
        setFileError(
          err instanceof Error ? err.message : 'Erro ao ler o arquivo selecionado.'
        );
      }
    },
    [loadBufferIntoLibraryAndPlayer]
  );

  const selectBuiltInSong = useCallback((song: BuiltInCatalogSong) => {
    setCurrentDoc({
      id: song.id,
      kind: 'gp',
      fileName: song.title,
      source: {
        type: 'tex',
        data: song.tex,
        fileName: song.title,
      },
    });
  }, []);

  const loadCustomAlphaTex = useCallback((title: string, tex: string) => {
    setCurrentDoc({
      id: `alphatex-${Date.now()}`,
      kind: 'gp',
      fileName: title,
      source: {
        type: 'tex',
        data: tex,
        fileName: title,
      },
    });
  }, []);

  const saveCurrentSongSettings = useCallback(
    async (settings: SavedSongSettings) => {
      if (!currentDoc.id.startsWith('tab-')) return;
      const updated = await repository.updateMeta(currentDoc.id, { settings });
      if (updated) {
        setLibraryItems((prev) =>
          prev.map((i) => (i.id === currentDoc.id ? updated : i))
        );
      }
    },
    [currentDoc.id, repository]
  );

  const saveCurrentSongMetadata = useCallback(
    async (meta: { title: string; artist: string }) => {
      if (!currentDoc.id.startsWith('tab-')) return;
      const updated = await repository.updateMeta(currentDoc.id, {
        title: meta.title,
        artist: meta.artist,
      });
      if (updated) {
        setLibraryItems((prev) =>
          prev.map((i) => (i.id === currentDoc.id ? updated : i))
        );
      }
    },
    [currentDoc.id, repository]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const target = libraryItems.find((i) => i.id === id);
      if (!target) return;
      const updated = await repository.updateMeta(id, {
        favorite: !target.favorite,
      });
      if (updated) {
        setLibraryItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    },
    [libraryItems, repository]
  );

  const changeStatus = useCallback(
    async (id: string, status: StudyStatus) => {
      const updated = await repository.updateMeta(id, { status });
      if (updated) {
        setLibraryItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    },
    [repository]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await repository.delete(id);
      setLibraryItems((prev) => prev.filter((i) => i.id !== id));
      if (currentDoc.id === id) {
        setCurrentDoc(DEFAULT_DEMO_DOC);
      }
    },
    [currentDoc.id, repository]
  );

  return {
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
  };
}

