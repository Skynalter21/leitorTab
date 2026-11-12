// Single Responsibility Service: Song Section Extraction, Classification & Smart Auto-Splitting
// Extracts structural sections (Intro, Verse, Chorus, Bridge/Ponte, Solo, Riff, Outro) from
// Guitar Pro MasterBars and supports user-defined custom sections.

import type * as alphaTab from '@coderline/alphatab';
import type { SongSection, SongSectionCategory } from '../../domain/models';

export interface SectionCategoryMeta {
  id: SongSectionCategory;
  label: string;
  shortBadge: string;
}

export const SECTION_CATEGORIES: SectionCategoryMeta[] = [
  { id: 'all', label: 'Todas as Partes', shortBadge: 'TODAS' },
  { id: 'intro', label: 'Introdução', shortBadge: 'INTRO' },
  { id: 'verse', label: 'Verso / Estrofe', shortBadge: 'VERSO' },
  { id: 'riff', label: 'Riff / Tema', shortBadge: 'RIFF' },
  { id: 'bridge', label: 'Ponte (Bridge)', shortBadge: 'PONTE' },
  { id: 'chorus', label: 'Refrão (Chorus)', shortBadge: 'REFRÃO' },
  { id: 'solo', label: 'Solo / Lead', shortBadge: 'SOLO' },
  { id: 'outro', label: 'Final (Outro)', shortBadge: 'FINAL' },
  { id: 'other', label: 'Outras Partes', shortBadge: 'PARTE' },
];

export function getCategoryBadgeLabel(
  category: Exclude<SongSectionCategory, 'all'>
): string {
  const found = SECTION_CATEGORIES.find((c) => c.id === category);
  return found ? found.shortBadge : 'PARTE';
}

export function classifySectionCategory(
  rawText: string,
  marker?: string
): Exclude<SongSectionCategory, 'all'> {
  const combined = `${rawText} ${marker || ''}`.toLowerCase().trim();

  if (
    combined.includes('intro') ||
    combined.includes('abertura') ||
    combined.includes('opening') ||
    combined.includes('prelúdio') ||
    combined.includes('prelude')
  ) {
    return 'intro';
  }

  if (
    combined.includes('solo') ||
    combined.includes('lead') ||
    combined.includes('improviso') ||
    combined.includes('shred') ||
    combined.includes('melody') ||
    combined.includes('melodia')
  ) {
    return 'solo';
  }

  if (
    combined.includes('bridge') ||
    combined.includes('ponte') ||
    combined.includes('interlude') ||
    combined.includes('interlúdio') ||
    combined.includes('breakdown') ||
    combined.includes('passagem') ||
    combined.includes('transição') ||
    combined.includes('middle') ||
    combined.includes('pre-solo')
  ) {
    return 'bridge';
  }

  if (
    combined.includes('chorus') ||
    combined.includes('refrão') ||
    combined.includes('refrao') ||
    combined.includes('hook')
  ) {
    return 'chorus';
  }

  if (
    combined.includes('verse') ||
    combined.includes('verso') ||
    combined.includes('estrofe') ||
    combined.includes('stanza') ||
    combined.includes('vocal') ||
    combined.includes('parte a') ||
    combined.includes('part a')
  ) {
    return 'verse';
  }

  if (
    combined.includes('riff') ||
    combined.includes('main') ||
    combined.includes('tema') ||
    combined.includes('theme') ||
    combined.includes('groove') ||
    combined.includes('heavy')
  ) {
    return 'riff';
  }

  if (
    combined.includes('outro') ||
    combined.includes('final') ||
    combined.includes('ending') ||
    combined.includes('coda') ||
    combined.includes('fade')
  ) {
    return 'outro';
  }

  return 'other';
}

/**
 * Extracts all native sections from a Guitar Pro score (`score.masterBars`)
 * and merges any custom user-created sections.
 */
export function extractSectionsFromScore(
  score: alphaTab.model.Score,
  customSections: SongSection[] = []
): SongSection[] {
  const totalBars = score.masterBars.length;
  if (totalBars === 0) return [];

  const nativeStarts: {
    barNumber: number;
    name: string;
    marker?: string;
  }[] = [];

  score.masterBars.forEach((mb, idx) => {
    if (mb.section && (mb.section.text?.trim() || mb.section.marker?.trim())) {
      const text = mb.section.text?.trim() || '';
      const marker = mb.section.marker?.trim() || '';
      const displayName = text || (marker ? `Seção ${marker}` : `Parte ${idx + 1}`);
      nativeStarts.push({
        barNumber: idx + 1,
        name: displayName,
        marker: marker || undefined,
      });
    }
  });

  const extractedNative: SongSection[] = [];

  if (nativeStarts.length > 0) {
    // If the first section starts after bar 1, prepend an Intro section for bars 1..(first - 1)
    if (nativeStarts[0].barNumber > 1) {
      extractedNative.push({
        id: `native-intro-1-${nativeStarts[0].barNumber - 1}`,
        name: 'Introdução',
        marker: 'Intro',
        category: 'intro',
        startBar: 1,
        endBar: nativeStarts[0].barNumber - 1,
        isCustom: false,
      });
    }

    for (let i = 0; i < nativeStarts.length; i++) {
      const current = nativeStarts[i];
      const next = nativeStarts[i + 1];
      const endBar = next ? Math.max(current.barNumber, next.barNumber - 1) : totalBars;
      const category = classifySectionCategory(current.name, current.marker);

      extractedNative.push({
        id: `native-${i}-${current.barNumber}-${endBar}`,
        name: current.name,
        marker: current.marker,
        category,
        startBar: current.barNumber,
        endBar,
        isCustom: false,
      });
    }
  }

  // Clamp and sanitize custom sections to valid bar numbers
  const validCustom: SongSection[] = customSections
    .map((cs) => {
      const startBar = Math.max(1, Math.min(totalBars, cs.startBar));
      const endBar = Math.max(startBar, Math.min(totalBars, cs.endBar));
      return {
        ...cs,
        startBar,
        endBar,
        isCustom: true,
      };
    })
    .sort((a, b) => a.startBar - b.startBar);

  // If the user explicitly created custom sections and there are no native sections,
  // or if both exist, return combined list sorted by startBar
  return [...extractedNative, ...validCustom].sort((a, b) => {
    if (a.startBar !== b.startBar) return a.startBar - b.startBar;
    return a.endBar - b.endBar;
  });
}

/**
 * Generates smart practice parts when a Guitar Pro file has no native section markers,
 * or when the user clicks "Auto-Dividir Música em Partes".
 */
export function generateSmartSections(score: alphaTab.model.Score): SongSection[] {
  const totalBars = score.masterBars.length;
  if (totalBars === 0) return [];

  // Choose sensible phrase length based on song length
  const targetChunk =
    totalBars <= 8 ? 2 : totalBars <= 20 ? 4 : totalBars <= 64 ? 8 : 16;

  const breakBars = new Set<number>([1]);

  score.masterBars.forEach((mb, idx) => {
    const barNum = idx + 1;
    if (barNum === 1) return;
    if (
      mb.isRepeatStart ||
      mb.isDoubleBar ||
      (mb.tempoAutomations && mb.tempoAutomations.length > 0)
    ) {
      breakBars.add(barNum);
    }
  });

  // If structural markers were sparse, subdivide into phrase chunks of targetChunk bars
  if (breakBars.size <= 2) {
    for (let b = 1; b <= totalBars; b += targetChunk) {
      breakBars.add(b);
    }
  }

  const sortedStarts = Array.from(breakBars).sort((a, b) => a - b);
  const templateSequence: {
    name: string;
    category: Exclude<SongSectionCategory, 'all'>;
  }[] = [
    { name: 'Introdução', category: 'intro' },
    { name: 'Verso / Riff Principal', category: 'verse' },
    { name: 'Ponte (Bridge)', category: 'bridge' },
    { name: 'Refrão (Chorus)', category: 'chorus' },
    { name: 'Solo Principal', category: 'solo' },
    { name: 'Riff / Variação', category: 'riff' },
    { name: 'Refrão Final', category: 'chorus' },
    { name: 'Final (Outro)', category: 'outro' },
  ];

  return sortedStarts.map((startBar, idx) => {
    const nextStart = sortedStarts[idx + 1];
    const endBar = nextStart ? Math.max(startBar, nextStart - 1) : totalBars;

    let labelInfo: { name: string; category: Exclude<SongSectionCategory, 'all'> };
    if (idx === 0) {
      labelInfo = { name: 'Introdução', category: 'intro' };
    } else if (idx === sortedStarts.length - 1 && sortedStarts.length >= 3) {
      labelInfo = { name: 'Final (Outro)', category: 'outro' };
    } else {
      const tpl = templateSequence[idx % templateSequence.length];
      labelInfo = {
        name:
          sortedStarts.length > templateSequence.length
            ? `${tpl.name} #${Math.floor(idx / templateSequence.length) + 1}`
            : tpl.name,
        category: tpl.category,
      };
    }

    return {
      id: `auto-part-${idx + 1}-${startBar}-${endBar}`,
      name: labelInfo.name,
      marker: String.fromCharCode(65 + (idx % 26)),
      category: labelInfo.category,
      startBar,
      endBar,
      isCustom: true,
    };
  });
}

