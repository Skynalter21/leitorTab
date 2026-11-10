// Live Online Tab Search Provider implementing ITabSearchProvider (SRP, OCP, LSP, DIP)
// Indexes 53,000+ free Guitar Pro (.gp3, .gp4, .gp5, .gpx), MusicXML (.mxl) and .pdf files
// across public GitHub repositories using Git Trees API + IndexedDB caching.

import type { ITabSearchProvider } from '../domain/contracts';
import type { OnlineTabResult } from '../domain/models';

export type { OnlineTabResult };

interface CompactIndexRecord {
  r: number; // repo index in REPO_SOURCES
  p: string; // relative file path in repo
}

export interface GithubRepoSourceConfig {
  slug: string;
  branch: string;
  label: string;
  fastLoad?: boolean;
}

const DEFAULT_REPO_SOURCES: GithubRepoSourceConfig[] = [
  {
    slug: 'AlexMi-Ha/GuitarTabs',
    branch: 'main',
    label: 'Rock/Metal GP5',
    fastLoad: true,
  },
  {
    slug: 'aristides93/GuitarTabs',
    branch: 'main',
    label: 'Clássicos do Rock',
    fastLoad: true,
  },
  {
    slug: 'morishin/TAB',
    branch: 'master',
    label: 'Indie/Rock GP5',
    fastLoad: true,
  },
  {
    slug: 'YetAnotherMorty/Guitar-Pro-Tabs',
    branch: 'main',
    label: 'Mega Arquivo (52k+ Tabs)',
    fastLoad: false,
  },
];

const VALID_EXT_REGEX = /\.(gp|gp3|gp4|gp5|gpx|gp7|gp8|mxl|pdf)$/i;
const CACHE_DB_NAME = 'LeitorTabOnlineIndexCache';
const CACHE_STORE = 'tree_cache';
const CACHE_KEY = 'compact_v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export type SearchIndexStatus =
  | 'idle'
  | 'loading-fast'
  | 'loading-full'
  | 'ready'
  | 'error';

/**
 * Concrete Search Provider implementing ITabSearchProvider (OCP & LSP).
 * Open for extension by injecting custom GithubRepoSourceConfig entries.
 */
export class GithubTreeTabSearchProvider implements ITabSearchProvider {
  readonly providerId = 'github-trees-provider';
  readonly providerName = 'GitHub Open Guitar Pro Repositories';

  private memoryIndex: CompactIndexRecord[] = [];
  private status: SearchIndexStatus = 'idle';
  private readonly listeners = new Set<() => void>();
  private readonly repoSources: GithubRepoSourceConfig[];

  constructor(repoSources: GithubRepoSourceConfig[] = DEFAULT_REPO_SOURCES) {
    this.repoSources = repoSources;
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  getState() {
    return {
      status: this.status,
      totalIndexedCount: this.memoryIndex.length,
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  async initialize(): Promise<void> {
    if (
      this.status === 'ready' ||
      this.status === 'loading-fast' ||
      this.status === 'loading-full'
    ) {
      return;
    }

    this.status = 'loading-fast';
    this.notify();

    const cached = await this.readCachedIndex();
    if (cached && cached.length > 0) {
      this.memoryIndex = cached;
      this.status = 'ready';
      this.notify();
      return;
    }

    try {
      const fastIndice = this.repoSources
        .map((r, idx) => ({ r, idx }))
        .filter((x) => x.r.fastLoad !== false);
      const slowIndice = this.repoSources
        .map((r, idx) => ({ r, idx }))
        .filter((x) => x.r.fastLoad === false);

      const fastResults = await Promise.allSettled(
        fastIndice.map((item) => this.fetchRepoTree(item.idx))
      );

      const initialRecords: CompactIndexRecord[] = [];
      for (const res of fastResults) {
        if (res.status === 'fulfilled') {
          initialRecords.push(...res.value);
        }
      }

      this.memoryIndex = initialRecords;
      this.status = 'loading-full';
      this.notify();

      const slowResults = await Promise.allSettled(
        slowIndice.map((item) => this.fetchRepoTree(item.idx))
      );

      const megaRecords: CompactIndexRecord[] = [];
      for (const res of slowResults) {
        if (res.status === 'fulfilled') {
          megaRecords.push(...res.value);
        }
      }

      this.memoryIndex = [...initialRecords, ...megaRecords];
      this.status = 'ready';
      this.notify();

      if (this.memoryIndex.length > 500) {
        await this.writeCachedIndex(this.memoryIndex);
      }
    } catch (err) {
      console.warn('Partial or failed GitHub tree index load:', err);
      this.status = this.memoryIndex.length > 0 ? 'ready' : 'error';
      this.notify();
    }
  }

  search(query: string, maxResults = 35): OnlineTabResult[] {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) return [];

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const matches: Array<{ rec: CompactIndexRecord; score: number }> = [];

    for (let i = 0; i < this.memoryIndex.length; i++) {
      const rec = this.memoryIndex[i];
      const lowerPath = rec.p.toLowerCase();

      let allFound = true;
      for (let t = 0; t < tokens.length; t++) {
        if (!lowerPath.includes(tokens[t])) {
          allFound = false;
          break;
        }
      }
      if (!allFound) continue;

      const slashIdx = lowerPath.lastIndexOf('/');
      const filePart = slashIdx !== -1 ? lowerPath.slice(slashIdx + 1) : lowerPath;

      let score = 0;
      if (filePart.startsWith(tokens[0])) score += 30;
      if (filePart.includes(cleaned)) score += 20;
      if (lowerPath.endsWith('.gp5')) score += 10;
      else if (lowerPath.endsWith('.gp4')) score += 5;

      matches.push({ rec, score });
      if (matches.length >= 400) break;
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, maxResults).map((m) => this.parseRecordToResult(m.rec));
  }

  private async fetchRepoTree(repoIdx: number): Promise<CompactIndexRecord[]> {
    const source = this.repoSources[repoIdx];
    const url = `https://api.github.com/repos/${source.slug}/git/trees/${source.branch}?recursive=1`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${source.slug}`);
    }
    const data = (await res.json()) as {
      tree?: Array<{ path: string; type: string }>;
    };
    if (!Array.isArray(data.tree)) return [];

    const out: CompactIndexRecord[] = [];
    for (const item of data.tree) {
      if (item.type === 'blob' && VALID_EXT_REGEX.test(item.path)) {
        out.push({ r: repoIdx, p: item.path });
      }
    }
    return out;
  }

  private buildDownloadUrl(repoIdx: number, path: string): string {
    const source = this.repoSources[repoIdx];
    const encodedSegments = path
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    return `https://raw.githubusercontent.com/${source.slug}/${source.branch}/${encodedSegments}`;
  }

  private parseRecordToResult(rec: CompactIndexRecord): OnlineTabResult {
    const parts = rec.p.split('/');
    const fileName = parts[parts.length - 1] || rec.p;
    const dotIdx = fileName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? fileName.slice(dotIdx).toLowerCase() : '.gp5';
    const baseName = dotIdx !== -1 ? fileName.slice(0, dotIdx) : fileName;

    let artist = '';
    let displayTitle = baseName;

    if (baseName.includes(' - ')) {
      const [art, ...rest] = baseName.split(' - ');
      artist = art.trim();
      displayTitle = rest.join(' - ').trim();
    } else if (parts.length >= 3) {
      artist = parts[parts.length - 2];
    } else {
      artist = this.repoSources[rec.r].label;
    }

    return {
      id: `${rec.r}:${rec.p}`,
      fileName,
      displayTitle: displayTitle || baseName,
      artist,
      ext,
      repo: this.repoSources[rec.r].slug,
      downloadUrl: this.buildDownloadUrl(rec.r, rec.p),
    };
  }

  private async readCachedIndex(): Promise<CompactIndexRecord[] | null> {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(CACHE_DB_NAME, 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore(CACHE_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      return await new Promise<CompactIndexRecord[] | null>((resolve) => {
        const tx = db.transaction(CACHE_STORE, 'readonly');
        const req = tx.objectStore(CACHE_STORE).get(CACHE_KEY);
        req.onsuccess = () => {
          const val = req.result as
            | { ts: number; records: CompactIndexRecord[] }
            | undefined;
          if (
            val &&
            Date.now() - val.ts < CACHE_TTL_MS &&
            Array.isArray(val.records) &&
            val.records.length > 500
          ) {
            resolve(val.records);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async writeCachedIndex(records: CompactIndexRecord[]): Promise<void> {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(CACHE_DB_NAME, 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore(CACHE_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = db.transaction(CACHE_STORE, 'readwrite');
      tx.objectStore(CACHE_STORE).put({ ts: Date.now(), records }, CACHE_KEY);
    } catch {
      // Ignore cache write errors
    }
  }
}

export const defaultOnlineSearchProvider = new GithubTreeTabSearchProvider();

export const subscribeIndexStatus = (cb: () => void) =>
  defaultOnlineSearchProvider.subscribe(cb);
export const getSearchIndexState = () => defaultOnlineSearchProvider.getState();
export const ensureOnlineSearchIndexLoaded = () =>
  defaultOnlineSearchIndexLoadedHelper();
export const searchOnlineTabs = (query: string, maxResults = 35) =>
  defaultOnlineSearchProvider.search(query, maxResults);

function defaultOnlineSearchIndexLoadedHelper(): Promise<void> {
  return defaultOnlineSearchProvider.initialize();
}
