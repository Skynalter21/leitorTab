import React, { useState, useEffect, useMemo } from 'react';
import { BUILTIN_CATALOG, type BuiltInCatalogSong, DEMO_ALPHATEX } from '../data/demoSong';
import {
  ensureOnlineSearchIndexLoaded,
  searchOnlineTabs,
} from '../services/onlineTabSearch';
import {
  X,
  Sparkles,
  Globe,
  Link2,
  Code2,
  Search,
  Download,
  Music2,
  FileText,
  Play,
  Copy,
  Check,
} from 'lucide-react';

interface FreeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuiltIn: (song: BuiltInCatalogSong) => void;
  onLoadRemoteBuffer: (fileName: string, buffer: ArrayBuffer) => Promise<void>;
  onLoadCustomAlphaTex: (title: string, tex: string) => void;
}

interface GithubFileEntry {
  name: string;
  path: string;
  size: number;
  download_url: string | null;
  type: 'file' | 'dir';
}

const PRESET_REPOS = [
  {
    id: 'community-gp5',
    label: 'Catálogo Rock / Metal (.GP4 / .GP5)',
    apiPath: 'https://api.github.com/repos/AlexMi-Ha/GuitarTabs/contents',
    description: 'Coleção pública no GitHub com dezenas de tablaturas multi-instrumentos (.gp4 e .gp5).',
  },
  {
    id: 'alphatab-gp5',
    label: 'Oficiais AlphaTab (.GP5)',
    apiPath:
      'https://api.github.com/repos/CoderLine/alphaTab/contents/packages/alphatab/test-data/guitarpro5',
    description: 'Arquivos oficiais de demonstração do motor AlphaTab (inclui Canon Rock completo em .gp5).',
  },
  {
    id: 'alphatab-classical-pdf',
    label: 'Clássicos MusicXML & PDFs de Teste',
    apiPath:
      'https://api.github.com/repos/CoderLine/alphaTab/contents/packages/alphatab/test-data/musicxml-samples',
    description: 'Partituras em domínio público (.mxl e .pdf) de Beethoven, Mozart, Brahms e Schubert.',
  },
];

const SUPPORTED_EXT = ['.gp', '.gp3', '.gp4', '.gp5', '.gpx', '.gp7', '.gp8', '.mxl', '.xml', '.pdf'];

const AI_PROMPT_TEMPLATE = `Crie uma tablatura multi-instrumentos em formato AlphaTex (para @coderline/alphatab) contendo:
1. \\track "Guitarra Solo" com \\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 30
2. \\track "Guitarra Base" com \\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 29
3. \\track "Contrabaixo" com \\staff{score tab} \\tuning G2 D2 A1 E1 \\instrument 33
Use compassos separados por | e notas no formato casa.corda (ex: :8 12.1 15.1).`;

export const FreeCatalogModal: React.FC<FreeCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectBuiltIn,
  onLoadRemoteBuffer,
  onLoadCustomAlphaTex,
}) => {
  const [activeTab, setActiveTab] = useState<'builtin' | 'github' | 'url' | 'alphatex'>('github');

  // GitHub Repo Explorer state
  const [selectedRepoApi, setSelectedRepoApi] = useState<string>(PRESET_REPOS[0].apiPath);
  const [customRepoSlug, setCustomRepoSlug] = useState<string>('');
  const [repoFiles, setRepoFiles] = useState<GithubFileEntry[]>([]);
  const [repoLoading, setRepoLoading] = useState<boolean>(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repoSearch, setRepoSearch] = useState<string>('');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Direct URL state
  const [directUrl, setDirectUrl] = useState<string>(
    'https://raw.githubusercontent.com/CoderLine/alphaTab/develop/packages/alphatab/test-data/guitarpro5/canon.gp5'
  );
  const [urlLoading, setUrlLoading] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // AlphaTex Editor state
  const [customTitle, setCustomTitle] = useState<string>('Minha Jam AlphaTex');
  const [customTex, setCustomTex] = useState<string>(DEMO_ALPHATEX.trim());
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Fetch files from selected GitHub repo when on 'github' tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'github') return;
    ensureOnlineSearchIndexLoaded();

    let cancelled = false;
    setRepoLoading(true);
    setRepoError(null);

    fetch(selectedRepoApi)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`GitHub API retornou status ${res.status}`);
        }
        return res.json();
      })
      .then((data: GithubFileEntry[]) => {
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setRepoFiles([]);
          return;
        }
        const validFiles = data.filter(
          (item) =>
            item.type === 'file' &&
            item.download_url &&
            SUPPORTED_EXT.some((ext) => item.name.toLowerCase().endsWith(ext))
        );
        setRepoFiles(validFiles);
        setRepoLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setRepoError(
          err instanceof Error
            ? err.message
            : 'Erro ao consultar repositório público no GitHub.'
        );
        setRepoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, selectedRepoApi]);

  const filteredRepoFiles = useMemo(() => {
    const q = repoSearch.trim();
    if (!q) return repoFiles;
    // Search across all 53,000+ indexed tabs when typing in the modal search box
    const globalHits = searchOnlineTabs(q, 80);
    if (globalHits.length > 0) {
      return globalHits.map((hit) => ({
        name: hit.fileName,
        path: `${hit.repo}/${hit.fileName}`,
        size: 32768,
        download_url: hit.downloadUrl,
        type: 'file' as const,
      }));
    }
    return repoFiles.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  }, [repoFiles, repoSearch]);

  const handleDownloadFromGithub = async (file: GithubFileEntry) => {
    if (!file.download_url) return;
    setDownloadingFile(file.name);
    setRepoError(null);

    try {
      const response = await fetch(file.download_url);
      if (!response.ok) {
        throw new Error(`Falha ao baixar arquivo (${response.status})`);
      }
      const buffer = await response.arrayBuffer();
      await onLoadRemoteBuffer(file.name, buffer);
      onClose();
    } catch (err) {
      setRepoError(
        err instanceof Error ? err.message : 'Erro ao baixar tablatura do GitHub.'
      );
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleLoadCustomGithubRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customRepoSlug.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');
    if (!cleaned || !cleaned.includes('/')) {
      setRepoError('Digite no formato usuario/repositorio (ex: AlexMi-Ha/GuitarTabs)');
      return;
    }
    setSelectedRepoApi(`https://api.github.com/repos/${cleaned}/contents`);
  };

  const handleLoadDirectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = directUrl.trim();
    if (!trimmed) return;

    setUrlLoading(true);
    setUrlError(null);

    try {
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error(`Servidor retornou status ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const urlParts = trimmed.split('/');
      const rawName = decodeURIComponent(urlParts[urlParts.length - 1] || 'tablatura.gp5').split('?')[0];
      await onLoadRemoteBuffer(rawName, buffer);
      onClose();
    } catch (err) {
      setUrlError(
        err instanceof Error
          ? `Não foi possível carregar a URL (${err.message}). Verifique se o link é público (ex: raw.githubusercontent.com).`
          : 'Erro ao carregar URL.'
      );
    } finally {
      setUrlLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <Globe size={20} className="text-indigo" />
            <div>
              <h2>Catálogo Gratuito de Tablaturas & Importador Online</h2>
              <p>
                Baixe com 1 clique de repositórios públicos do GitHub, use o catálogo integrado ou importe por URL
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="catalog-nav-tabs">
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <Globe size={15} />
            <span>Repositórios GitHub Online (.GP5 / .PDF)</span>
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'builtin' ? 'active' : ''}`}
            onClick={() => setActiveTab('builtin')}
          >
            <Sparkles size={15} />
            <span>Jams Multi-Instrumentos Integradas ({BUILTIN_CATALOG.length})</span>
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            <Link2 size={15} />
            <span>Importar por Link (URL)</span>
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'alphatex' ? 'active' : ''}`}
            onClick={() => setActiveTab('alphatex')}
          >
            <Code2 size={15} />
            <span>Editor AlphaTex (Texto / IA)</span>
          </button>
        </div>

        {/* TAB 1: GitHub Public Repositories Explorer */}
        {activeTab === 'github' && (
          <div className="catalog-tab-content">
            <div className="repo-selector-bar">
              <div className="repo-preset-chips">
                {PRESET_REPOS.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    className={`filter-chip ${
                      selectedRepoApi === repo.apiPath ? 'active' : ''
                    }`}
                    onClick={() => setSelectedRepoApi(repo.apiPath)}
                    title={repo.description}
                  >
                    {repo.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLoadCustomGithubRepo} className="custom-repo-form">
                <input
                  type="text"
                  placeholder="Outro repo GitHub (ex: usuario/repo)"
                  value={customRepoSlug}
                  onChange={(e) => setCustomRepoSlug(e.target.value)}
                />
                <button type="submit" className="btn-xs">
                  Listar
                </button>
              </form>
            </div>

            <div className="drawer-toolbar">
              <div className="search-input-box">
                <Search size={15} className="icon-muted" />
                <input
                  type="text"
                  placeholder="Filtrar músicas neste repositório (ex: ACDC, Canon, Avenged, Mozart)..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                />
              </div>
              <span className="range-label">
                {filteredRepoFiles.length} arquivos disponíveis
              </span>
            </div>

            {repoError && <div className="error-banner">{repoError}</div>}

            <div className="catalog-grid-scroll">
              {repoLoading ? (
                <div className="loading-overlay">
                  <div className="spinner" />
                  <p>Consultando arquivos gratuitos no GitHub...</p>
                </div>
              ) : (
                <div className="github-files-list">
                  {filteredRepoFiles.map((file) => {
                    const isPdf = file.name.toLowerCase().endsWith('.pdf');
                    const isBusy = downloadingFile === file.name;
                    const kb = Math.max(1, Math.round(file.size / 1024));

                    return (
                      <div key={file.path} className="github-file-row">
                        <div className="github-file-info">
                          {isPdf ? (
                            <FileText size={17} className="pill-icon pdf" />
                          ) : (
                            <Music2 size={17} className="pill-icon gp" />
                          )}
                          <div>
                            <div className="github-file-name">{file.name}</div>
                            <div className="github-file-meta">
                              {isPdf ? 'Documento PDF' : 'Tablatura Interativa Multi-Trilhas'} •{' '}
                              {kb} KB
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-primary-upload"
                          disabled={Boolean(downloadingFile)}
                          onClick={() => handleDownloadFromGithub(file)}
                        >
                          <Download size={15} />
                          <span>{isBusy ? 'Carregando...' : 'Abrir & Salvar'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Built-In Offline Multi-Instrument Catalog */}
        {activeTab === 'builtin' && (
          <div className="catalog-tab-content">
            <div className="catalog-grid-scroll">
              <div className="builtin-cards-grid">
                {BUILTIN_CATALOG.map((song) => (
                  <div key={song.id} className="builtin-song-card">
                    <div className="builtin-card-top">
                      <span className="genre-badge">{song.genre}</span>
                      <span className="bpm-badge">{song.bpm} BPM</span>
                    </div>
                    <h3>{song.title}</h3>
                    <p className="builtin-artist">{song.artist}</p>
                    <p className="builtin-desc">{song.description}</p>
                    <div className="builtin-tracks-tags">
                      {song.instruments.map((inst) => (
                        <span key={inst} className="saved-pref-tag">
                          🎸 {inst}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-primary-upload full-w"
                      onClick={() => {
                        onSelectBuiltIn(song);
                        onClose();
                      }}
                    >
                      <Play size={15} />
                      <span>Tocar Agora no Player</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Direct URL Importer */}
        {activeTab === 'url' && (
          <div className="catalog-tab-content padded">
            <form onSubmit={handleLoadDirectUrl} className="url-import-box">
              <h3>Carregar Arquivo .GP / .GP5 / .MXL / .PDF por Link Direto</h3>
              <p>
                Cole abaixo qualquer link direto (ex: <code>raw.githubusercontent.com</code> ou CDN pública) para baixar a tablatura direto para a sua Biblioteca:
              </p>

              {urlError && <div className="error-banner">{urlError}</div>}

              <div className="url-input-row">
                <input
                  type="url"
                  required
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../arquivo.gp5"
                />
                <button
                  type="submit"
                  className="btn-primary-upload"
                  disabled={urlLoading}
                >
                  <Download size={16} />
                  <span>{urlLoading ? 'Baixando...' : 'Importar URL'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Live AlphaTex Editor */}
        {activeTab === 'alphatex' && (
          <div className="catalog-tab-content padded">
            <div className="alphatex-editor-box">
              <div className="alphatex-header-row">
                <div>
                  <h3>Editor AlphaTex (Crie ou Cole Tablaturas em Texto)</h3>
                  <p>
                    Você pode escrever suas próprias tablaturas com múltiplos instrumentos ou pedir para uma IA gerar o código AlphaTex.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyPrompt}
                >
                  {copiedPrompt ? <Check size={15} /> : <Copy size={15} />}
                  <span>
                    {copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt para IA'}
                  </span>
                </button>
              </div>

              <input
                type="text"
                className="alphatex-title-input"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Nome da Música / Estudo"
              />

              <textarea
                className="alphatex-textarea"
                rows={11}
                value={customTex}
                onChange={(e) => setCustomTex(e.target.value)}
              />

              <button
                type="button"
                className="btn-primary-upload"
                onClick={() => {
                  onLoadCustomAlphaTex(customTitle || 'Tablatura AlphaTex', customTex);
                  onClose();
                }}
              >
                <Play size={16} />
                <span>Renderizar e Tocar no Player</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

