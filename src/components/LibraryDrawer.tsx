import React, { useState, useMemo } from 'react';
import type { LibraryItem, StudyStatus } from '../services/libraryDb';
import {
  X,
  Search,
  Star,
  Trash2,
  Music2,
  FileText,
  BookOpen,
  FolderPlus,
} from 'lucide-react';

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: LibraryItem[];
  activeId: string;
  onSelect: (item: LibraryItem) => void;
  onToggleFavorite: (id: string) => void;
  onChangeStatus: (id: string, status: StudyStatus) => void;
  onDelete: (id: string) => void;
  onOpenFilePicker: () => void;
}

const STATUS_LABELS: Record<StudyStatus, string> = {
  studying: 'Estudando',
  todo: 'Para Tirar',
  mastered: 'Dominada',
};

export const LibraryDrawer: React.FC<LibraryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  activeId,
  onSelect,
  onToggleFavorite,
  onChangeStatus,
  onDelete,
  onOpenFilePicker,
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'fav' | StudyStatus>('all');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.fileName.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.artist && item.artist.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (filterTab === 'fav') return item.favorite;
      if (filterTab === 'studying' || filterTab === 'todo' || filterTab === 'mastered') {
        return item.status === filterTab;
      }
      return true;
    });
  }, [items, search, filterTab]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside
        className="library-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <BookOpen size={20} className="text-indigo" />
            <div>
              <h2>Minha Biblioteca de Tablaturas</h2>
              <p>Salva automaticamente no navegador (IndexedDB)</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Search & Add File */}
        <div className="drawer-toolbar">
          <div className="search-input-box">
            <Search size={15} className="icon-muted" />
            <input
              type="text"
              placeholder="Buscar por música, artista ou arquivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary-upload"
            onClick={onOpenFilePicker}
          >
            <FolderPlus size={16} />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="drawer-filter-tabs">
          <button
            type="button"
            className={`filter-chip ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            Todas ({items.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterTab === 'fav' ? 'active' : ''}`}
            onClick={() => setFilterTab('fav')}
          >
            ★ Favoritas ({items.filter((i) => i.favorite).length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterTab === 'studying' ? 'active' : ''}`}
            onClick={() => setFilterTab('studying')}
          >
            Estudando
          </button>
          <button
            type="button"
            className={`filter-chip ${filterTab === 'todo' ? 'active' : ''}`}
            onClick={() => setFilterTab('todo')}
          >
            Para Tirar
          </button>
          <button
            type="button"
            className={`filter-chip ${filterTab === 'mastered' ? 'active' : ''}`}
            onClick={() => setFilterTab('mastered')}
          >
            Dominadas
          </button>
        </div>

        {/* Saved Items List */}
        <div className="drawer-list">
          {filteredItems.length === 0 ? (
            <div className="empty-library">
              <p>Nenhuma tablatura encontrada nesta categoria.</p>
              <span>
                Todos os arquivos <strong>.GP</strong> e <strong>.PDF</strong> que você abrir ficam salvos aqui automaticamente!
              </span>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isCurrent = item.id === activeId;
              const mutedCount = item.settings?.mutedTracks?.length || 0;
              const savedSpeed = item.settings?.playbackSpeed
                ? `${Math.round(item.settings.playbackSpeed * 100)}%`
                : null;

              return (
                <div
                  key={item.id}
                  className={`library-item-card ${isCurrent ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="btn-fav"
                    onClick={() => onToggleFavorite(item.id)}
                    title={item.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                  >
                    <Star
                      size={16}
                      fill={item.favorite ? '#f59e0b' : 'none'}
                      color={item.favorite ? '#f59e0b' : '#64748b'}
                    />
                  </button>

                  <div
                    className="library-item-main"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <div className="library-item-title-row">
                      {item.kind === 'pdf' ? (
                        <FileText size={16} className="pill-icon pdf" />
                      ) : (
                        <Music2 size={16} className="pill-icon gp" />
                      )}
                      <span className="library-item-title">
                        {item.title || item.fileName}
                      </span>
                    </div>
                    <div className="library-item-sub">
                      <span>{item.artist || item.fileName}</span>
                      {savedSpeed && (
                        <span className="saved-pref-tag">Vel: {savedSpeed}</span>
                      )}
                      {mutedCount > 0 && (
                        <span className="saved-pref-tag">
                          {mutedCount} instr. mutado(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="library-item-actions">
                    <select
                      className={`status-select ${item.status}`}
                      value={item.status}
                      onChange={(e) =>
                        onChangeStatus(item.id, e.target.value as StudyStatus)
                      }
                      title="Status de estudo"
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="btn-icon delete"
                      onClick={() => onDelete(item.id)}
                      title="Remover da biblioteca"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

