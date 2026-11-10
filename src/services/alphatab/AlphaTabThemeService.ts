// Single Responsibility & Open/Closed Principle:
// Encapsulates color palette strategies for AlphaTab score rendering (Light Paper vs. Dark Night Sheet).

import * as alphaTab from '@coderline/alphatab';

export interface ScoreThemePalette {
  mainGlyph: [number, number, number, number];
  secondaryGlyph: [number, number, number, number];
  staffLine: [number, number, number, number];
  barSeparator: [number, number, number, number];
  barNumber: [number, number, number, number];
  scoreInfo: [number, number, number, number];
}

export const LIGHT_SCORE_PALETTE: ScoreThemePalette = {
  mainGlyph: [0, 0, 0, 255],
  secondaryGlyph: [0, 0, 0, 100],
  staffLine: [165, 165, 165, 255],
  barSeparator: [34, 34, 17, 255],
  barNumber: [200, 0, 0, 255],
  scoreInfo: [0, 0, 0, 255],
};

export const DARK_SCORE_PALETTE: ScoreThemePalette = {
  mainGlyph: [241, 245, 249, 255],
  secondaryGlyph: [148, 163, 184, 200],
  staffLine: [71, 85, 105, 255],
  barSeparator: [100, 116, 139, 255],
  barNumber: [129, 140, 248, 255],
  scoreInfo: [248, 250, 252, 255],
};

export function applyScoreTheme(
  resources: alphaTab.RenderingResources,
  isDark: boolean
): void {
  const palette = isDark ? DARK_SCORE_PALETTE : LIGHT_SCORE_PALETTE;

  resources.mainGlyphColor = new alphaTab.model.Color(...palette.mainGlyph);
  resources.secondaryGlyphColor = new alphaTab.model.Color(...palette.secondaryGlyph);
  resources.staffLineColor = new alphaTab.model.Color(...palette.staffLine);
  resources.barSeparatorColor = new alphaTab.model.Color(...palette.barSeparator);
  resources.barNumberColor = new alphaTab.model.Color(...palette.barNumber);
  resources.scoreInfoColor = new alphaTab.model.Color(...palette.scoreInfo);
}

