// Single Responsibility Component: Song Section Tabs & Part-by-Part Study Navigator
// Allows filtering by section category (Intro, Verso, Ponte, Refrão, Solo, Riff, Final),
// selecting individual parts to isolate on the score & loop, marking parts as mastered,
// and creating/splitting custom sections.

import React, { useState } from 'react';
import type { SongSection, SongSectionCategory } from '../../domain/models';
import {
  SECTION_CATEGORIES,
  classifySectionCategory,
  getCategoryBadgeLabel,
} from '../../services/alphatab/SongSectionService';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface SongSectionsTabBarProps {
  sections: SongSection[];
  totalBars: number;
  activeSectionId: string | null; // null = Full Song ("Música Completa")
  isolateScoreView: boolean;
  masteredSectionIds: string[];
  defaultNewStartBar: number;
  defaultNewEndBar: number;
  onSelectSection: (section: SongSection | null) => void;
  onToggleIsolateScoreView: () => void;
  onToggleMasteredSection: (sectionId: string) => void;
  onAddCustomSection: (section: SongSection) => void;
  onDeleteCustomSection: (sectionId: string) => void;
  onAutoSplitSections: () => void;
}

const QUICK_PART_PRESETS: {
  label: string;
  category: Exclude<SongSectionCategory, 'all'>;
}[] = [
  { label: 'Introdução', category: 'intro' },
  { label: 'Verso', category: 'verse' },
  { label: 'Riff Principal', category: 'riff' },
  { label: 'Pré-Refrão', category: 'bridge' },
  { label: 'Refrão (Chorus)', category: 'chorus' },
  { label: 'Ponte (Bridge)', category: 'bridge' },
  { label: 'Solo Principal', category: 'solo' },
  { label: 'Solo 2', category: 'solo' },
  { label: 'Final (Outro)', category: 'outro' },
];

export const SongSectionsTabBar: React.FC<SongSectionsTabBarProps> = ({
  sections,
  totalBars,
  activeSectionId,
  isolateScoreView,
  masteredSectionIds,
  defaultNewStartBar,
  defaultNewEndBar,
  onSelectSection,
  onToggleIsolateScoreView,
  onToggleMasteredSection,
  onAddCustomSection,
  onDeleteCustomSection,
  onAutoSplitSections,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SongSectionCategory>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newPartName, setNewPartName] = useState<string>('Solo Principal');
  const [newPartCategory, setNewPartCategory] =
    useState<Exclude<SongSectionCategory, 'all'>>('solo');
  const [newStartBar, setNewStartBar] = useState<number>(1);
  const [newEndBar, setNewEndBar] = useState<number>(Math.min(4, totalBars || 4));

  const masteredSet = new Set(masteredSectionIds);

  // Filter sections by category tab
  const filteredSections =
    selectedCategory === 'all'
      ? sections
      : sections.filter((s) => s.category === selectedCategory);

  // Count how many sections exist per category so we show relevant category filters
  const categoryCounts = sections.reduce<Record<string, number>>((acc, sec) => {
    acc[sec.category] = (acc[sec.category] || 0) + 1;
    return acc;
  }, {});

  const masteredCount = sections.filter((s) => masteredSet.has(s.id)).length;
  const progressPct =
    sections.length > 0 ? Math.round((masteredCount / sections.length) * 100) : 0;

  const currentIdxInFiltered = filteredSections.findIndex(
    (s) => s.id === activeSectionId
  );

  const handlePrevSection = () => {
    if (filteredSections.length === 0) return;
    if (currentIdxInFiltered <= 0) {
      onSelectSection(null); // Back to Full Song
    } else {
      onSelectSection(filteredSections[currentIdxInFiltered - 1]);
    }
  };

  const handleNextSection = () => {
    if (filteredSections.length === 0) return;
    if (currentIdxInFiltered === -1) {
      onSelectSection(filteredSections[0]);
    } else if (currentIdxInFiltered < filteredSections.length - 1) {
      onSelectSection(filteredSections[currentIdxInFiltered + 1]);
    }
  };

  const handleOpenAddForm = () => {
    setNewStartBar(Math.max(1, Math.min(totalBars || 1, defaultNewStartBar)));
    setNewEndBar(
      Math.max(
        defaultNewStartBar,
        Math.min(totalBars || 1, defaultNewEndBar || Math.min(totalBars, defaultNewStartBar + 3))
      )
    );
    setShowAddForm((prev) => !prev);
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPartName.trim() || 'Nova Parte';
    const sBar = Math.max(1, Math.min(totalBars, newStartBar));
    const eBar = Math.max(sBar, Math.min(totalBars, newEndBar));

    const created: SongSection = {
      id: `custom-${Date.now()}-${sBar}-${eBar}`,
      name: trimmed,
      category: newPartCategory,
      startBar: sBar,
      endBar: eBar,
      isCustom: true,
    };

    onAddCustomSection(created);
    onSelectSection(created);
    setShowAddForm(false);
  };

  return (
    <div className="song-sections-bar">
      {/* Row 1: Header, Category Filters, Progress & Actions */}
      <div className="sections-top-row">
        <div className="sections-title-area">
          <span className="sections-badge-title">
            <Bookmark size={14} className="text-indigo" />
            <strong>Partes da Música ({sections.length})</strong>
          </span>

          {sections.length > 0 && (
            <span
              className={`sections-progress-pill ${
                masteredCount === sections.length && sections.length > 0 ? 'complete' : ''
              }`}
              title="Clique no ícone de check (✓) em cada aba para marcar as partes que você já aprendeu!"
            >
              <CheckCircle2 size={12} />
              <span>
                {masteredCount}/{sections.length} dominadas ({progressPct}%)
              </span>
            </span>
          )}
        </div>

        {/* Category Filter Pills (Intro, Verso, Ponte, Refrão, Solo, etc.) */}
        {sections.length > 0 && (
          <div className="sections-category-filters">
            <span className="filter-icon-label">
              <Filter size={12} /> Filtrar:
            </span>
            {SECTION_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all' ? sections.length : categoryCounts[cat.id] || 0;
              if (cat.id !== 'all' && count === 0) return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`cat-filter-chip ${
                    selectedCategory === cat.id ? 'active' : ''
                  } cat-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (
                      cat.id !== 'all' &&
                      activeSectionId &&
                      !sections.some(
                        (s) => s.id === activeSectionId && s.category === cat.id
                      )
                    ) {
                      const firstMatch = sections.find((s) => s.category === cat.id);
                      if (firstMatch) onSelectSection(firstMatch);
                    }
                  }}
                >
                  <span>{cat.label}</span>
                  <span className="cat-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right Actions: Isolate View Toggle, Auto-Split, + Add Custom Part */}
        <div className="sections-actions-right">
          <button
            type="button"
            className={`btn-section-action ${isolateScoreView ? 'active-isolate' : ''}`}
            onClick={onToggleIsolateScoreView}
            title="Quando ativado, a partitura filtra e exibe na tela APENAS os compassos da aba selecionada"
          >
            <Eye size={13} />
            <span>
              {isolateScoreView ? 'Isolar na Partitura: ON' : 'Isolar na Partitura: OFF'}
            </span>
          </button>

          <button
            type="button"
            className="btn-section-action"
            onClick={onAutoSplitSections}
            title="Divide automaticamente a música em partes (Introdução, Verso, Ponte, Solo, Final) caso o arquivo GP não tenha marcações ou você queira subdividir"
          >
            <Sparkles size={13} />
            <span>Auto-Dividir</span>
          </button>

          <button
            type="button"
            className={`btn-section-action primary ${showAddForm ? 'open' : ''}`}
            onClick={handleOpenAddForm}
            title="Criar ou dividir manualmente uma parte da música (ex: Solo, Ponte, Intro) escolhendo os compassos"
          >
            <Plus size={13} />
            <span>Dividir / Nova Parte</span>
          </button>
        </div>
      </div>

      {/* Optional Inline Creator Form to Split / Add a Custom Part */}
      {showAddForm && (
        <form className="custom-section-form" onSubmit={handleCreatePart}>
          <div className="custom-section-presets">
            <span>Sugestões rápidas:</span>
            {QUICK_PART_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`quick-part-chip ${
                  newPartName === preset.label ? 'active' : ''
                }`}
                onClick={() => {
                  setNewPartName(preset.label);
                  setNewPartCategory(preset.category);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="custom-section-inputs">
            <label className="cs-field">
              <span>Nome da Parte:</span>
              <input
                type="text"
                value={newPartName}
                onChange={(e) => {
                  setNewPartName(e.target.value);
                  setNewPartCategory(classifySectionCategory(e.target.value));
                }}
                placeholder="Ex: Solo Principal, Ponte, Intro..."
                required
              />
            </label>

            <label className="cs-field">
              <span>Tipo:</span>
              <select
                value={newPartCategory}
                onChange={(e) =>
                  setNewPartCategory(
                    e.target.value as Exclude<SongSectionCategory, 'all'>
                  )
                }
              >
                <option value="intro">Introdução</option>
                <option value="verse">Verso / Estrofe</option>
                <option value="riff">Riff / Tema</option>
                <option value="bridge">Ponte (Bridge)</option>
                <option value="chorus">Refrão (Chorus)</option>
                <option value="solo">Solo / Lead</option>
                <option value="outro">Final (Outro)</option>
                <option value="other">Outra Parte</option>
              </select>
            </label>

            <label className="cs-field small">
              <span>Do Compasso:</span>
              <input
                type="number"
                min={1}
                max={totalBars || 1}
                value={newStartBar}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(totalBars || 1, Number(e.target.value) || 1));
                  setNewStartBar(v);
                  if (v > newEndBar) setNewEndBar(v);
                }}
              />
            </label>

            <label className="cs-field small">
              <span>Até Compasso:</span>
              <input
                type="number"
                min={newStartBar}
                max={totalBars || 1}
                value={newEndBar}
                onChange={(e) => {
                  const v = Math.max(
                    newStartBar,
                    Math.min(totalBars || 1, Number(e.target.value) || newStartBar)
                  );
                  setNewEndBar(v);
                }}
              />
            </label>

            <div className="cs-form-buttons">
              <button type="submit" className="btn-xs active">
                Salvar Parte (c. {newStartBar}–{newEndBar})
              </button>
              <button
                type="button"
                className="btn-icon-sm"
                onClick={() => setShowAddForm(false)}
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Row 2: Horizontal Scrollable Section Tabs */}
      <div className="sections-tabs-row">
        <div className="sections-tabs-scroll">
          {/* Tab 0: Full Song */}
          <button
            type="button"
            className={`section-tab-item full-song ${
              activeSectionId === null ? 'active' : ''
            }`}
            onClick={() => onSelectSection(null)}
            title="Exibir e tocar a música inteira do início ao fim"
          >
            <Layers size={14} />
            <div className="section-tab-text">
              <span className="section-tab-name">Música Completa</span>
              <span className="section-tab-bars">1–{totalBars} compassos</span>
            </div>
          </button>

          {/* Individual Section Tabs */}
          {filteredSections.map((sec, idx) => {
            const isSelected = activeSectionId === sec.id;
            const isMastered = masteredSet.has(sec.id);
            const badgeText = getCategoryBadgeLabel(sec.category);

            return (
              <div
                key={sec.id}
                className={`section-tab-item cat-border-${sec.category} ${
                  isSelected ? 'active' : ''
                } ${isMastered ? 'mastered' : ''}`}
                onClick={() => onSelectSection(sec)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSection(sec);
                  }
                }}
                title={`Clique para isolar e treinar "${sec.name}" (Compassos ${sec.startBar} a ${sec.endBar})`}
              >
                <span className={`section-cat-badge badge-${sec.category}`}>
                  {sec.marker ? `${sec.marker} • ${badgeText}` : `${idx + 1}. ${badgeText}`}
                </span>

                <div className="section-tab-text">
                  <span className="section-tab-name">{sec.name}</span>
                  <span className="section-tab-bars">
                    c. {sec.startBar}–{sec.endBar} ({sec.endBar - sec.startBar + 1} comp.)
                  </span>
                </div>

                <div
                  className="section-tab-inline-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`btn-mastered-check ${isMastered ? 'checked' : ''}`}
                    onClick={() => onToggleMasteredSection(sec.id)}
                    title={
                      isMastered
                        ? 'Parte dominada! Clique para desmarcar'
                        : 'Marcar esta parte como aprendida/dominada'
                    }
                  >
                    <CheckCircle2 size={14} />
                  </button>

                  {sec.isCustom && (
                    <button
                      type="button"
                      className="btn-delete-part"
                      onClick={() => onDeleteCustomSection(sec.id)}
                      title="Remover esta divisão personalizada"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {sections.length === 0 && (
            <div className="sections-empty-hint">
              <span>
                Este arquivo não possui marcadores nativos de seção. Clique em{' '}
                <strong onClick={onAutoSplitSections} className="clickable-link">
                  Auto-Dividir
                </strong>{' '}
                ou{' '}
                <strong onClick={handleOpenAddForm} className="clickable-link">
                  + Dividir / Nova Parte
                </strong>{' '}
                para estudar por partes!
              </span>
            </div>
          )}
        </div>

        {/* Step-by-Step Prev / Next Part Navigator */}
        {filteredSections.length > 0 && (
          <div className="sections-step-nav">
            <button
              type="button"
              className="btn-step-part"
              onClick={handlePrevSection}
              disabled={activeSectionId === null}
              title="Voltar para a parte anterior da música"
            >
              <ChevronLeft size={15} />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              className="btn-step-part"
              onClick={handleNextSection}
              disabled={currentIdxInFiltered === filteredSections.length - 1}
              title="Avançar para a próxima parte da música"
            >
              <span>Próxima Parte</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

