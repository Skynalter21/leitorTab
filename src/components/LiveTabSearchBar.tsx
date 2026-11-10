import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ensureOnlineSearchIndexLoaded,
  getSearchIndexState,
  subscribeIndexStatus,
  searchOnlineTabs,
  type OnlineTabResult,
} from '../services/onlineTabSearch';
import { BUILTIN_CATALOG, type BuiltInCatalogSong } from '../data/demoSong';
import { Search, Download, Sparkles, Globe, X, Music2 } from 'lucide-react';

interface LiveTabSearchBarProps {
  onSelectBuiltIn: (song: BuiltInCatalogSong) => void;
  onLoadRemoteBuffer: (fileName: string, buffer: ArrayBuffer) => Promise<void>;
}

export const LiveTabSearchBar: React.FC<LiveTabSearchBarProps> = ({
  onSelectBuiltIn,
  onLoadRemoteBuffer,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [indexState, setIndexState] = useState(getSearchIndexState());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to online index status updates and preload index on mount
  useEffect(() => {
    const unsub = subscribeIndexStatus(() => {
      setIndexState(getSearchIndexState());
    });
    ensureOnlineSearchIndexLoaded();
    return unsub;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const builtInMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return BUILTIN_CATALOG.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q)
    );
  }, [query]);

  const onlineMatches = useMemo(() => {
    if (!query.trim()) return [];
    return searchOnlineTabs(query, 35);
  }, [query, indexState.totalIndexedCount, indexState.status]);

  const handleSelectOnlineResult = async (item: OnlineTabResult) => {
    setDownloadingId(item.id);
    setDownloadError(null);

    try {
      const res = await fetch(item.downloadUrl);
      if (!res.ok) {
        throw new Error(`Status HTTP ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      await onLoadRemoteBuffer(item.fileName, buffer);
      setIsOpen(false);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? `Falha ao baixar "${item.fileName}": ${err.message}`
          : 'Erro ao baixar tablatura.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="live-search-container" ref={wrapperRef}>
      <div className={`live-search-input-wrap ${isOpen ? 'focused' : ''}`}>
        <Search size={16} className="live-search-icon" />
        <input
          type="text"
          className="live-search-input"
          placeholder="Buscar música ou banda na internet (ex: Metallica, Iron Maiden, Nirvana, ACDC)..."
          value={query}
          onFocus={() => {
            setIsOpen(true);
            ensureOnlineSearchIndexLoaded();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="live-search-clear"
            onClick={() => {
              setQuery('');
              setDownloadError(null);
            }}
            title="Limpar busca"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Live Autocomplete Dropdown */}
      {isOpen && (
        <div className="live-search-dropdown">
          <div className="live-search-status-bar">
            <div className="status-left">
              <Globe size={13} className="text-indigo" />
              <span>
                {indexState.status === 'loading-fast' &&
                  'Conectando aos repositórios de tablaturas...'}
                {indexState.status === 'loading-full' &&
                  `${indexState.totalIndexedCount.toLocaleString('pt-BR')} tabs prontas (carregando arquivo de 53.000+ tabs...)`}
                {indexState.status === 'ready' &&
                  `${indexState.totalIndexedCount.toLocaleString('pt-BR')} tablaturas Guitar Pro (.gp3/.gp4/.gp5) prontas para busca instantânea`}
                {indexState.status === 'error' &&
                  'Índice parcial carregado (limite da API GitHub atingido)'}
              </span>
            </div>
            {!query.trim() && (
              <div className="quick-search-tags">
                <span>Experimente:</span>
                {['Metallica', 'ACDC', 'Iron Maiden', 'Nirvana', 'Canon'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => setQuery(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {downloadError && <div className="error-banner">{downloadError}</div>}

          <div className="live-search-results-list">
            {!query.trim() ? (
              <div className="live-search-empty">
                <Music2 size={24} className="text-indigo" />
                <p>
                  Digite o nome de qualquer <strong>banda</strong> ou{' '}
                  <strong>música</strong> acima para buscar em tempo real em mais de{' '}
                  <strong>53.000 tablaturas Guitar Pro</strong> gratuitas.
                </p>
              </div>
            ) : builtInMatches.length === 0 && onlineMatches.length === 0 ? (
              <div className="live-search-empty">
                <p>
                  Nenhuma tablatura encontrada para <strong>"{query}"</strong>.
                </p>
              </div>
            ) : (
              <>
                {builtInMatches.map((song) => (
                  <div
                    key={song.id}
                    className="live-result-item builtin"
                    onClick={() => {
                      onSelectBuiltIn(song);
                      setIsOpen(false);
                    }}
                  >
                    <div className="live-result-left">
                      <Sparkles size={16} className="pill-icon gp" />
                      <div>
                        <div className="live-result-title">{song.title}</div>
                        <div className="live-result-sub">
                          {song.artist} • Catálogo Integrado ({song.genre})
                        </div>
                      </div>
                    </div>
                    <span className="ext-badge builtin">INTEGRADA</span>
                  </div>
                ))}

                {onlineMatches.map((item) => {
                  const isBusy = downloadingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`live-result-item ${isBusy ? 'busy' : ''}`}
                      onClick={() => !downloadingId && handleSelectOnlineResult(item)}
                    >
                      <div className="live-result-left">
                        <Music2 size={16} className="pill-icon gp" />
                        <div>
                          <div className="live-result-title">{item.displayTitle}</div>
                          <div className="live-result-sub">
                            <strong>{item.artist}</strong> • Repositório: {item.repo}
                          </div>
                        </div>
                      </div>

                      <div className="live-result-right">
                        <span className="ext-badge">{item.ext.toUpperCase()}</span>
                        <button
                          type="button"
                          className="btn-xs play-online"
                          disabled={Boolean(downloadingId)}
                        >
                          <Download size={12} />
                          <span>{isBusy ? 'Abrindo...' : 'Abrir'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

