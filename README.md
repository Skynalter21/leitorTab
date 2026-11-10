# 🎸 LeitorTab Studio — Leitor de Tablaturas Guitar Pro & PDF

Aplicação web completa para estudo de guitarra, violão, baixo e bateria com suporte nativo a arquivos **Guitar Pro (`.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.mxl`)** e **partituras/cifras em `.pdf`**, construída com **React 19 + TypeScript + Vite**, motor **AlphaTab (`1.9.0`)**, **PDF.js** e **Web Audio API DSP**.

---

## ✨ Principais Recursos

- **🎛️ Mixer Multi-Pista Completo**:
  - Controle individual por instrumento de **Mute (`M`)**, **Solo (`S`)**, **Volume (`0%` a `150%`)** e visibilidade na partitura.
  - **Seletor de Timbre por Trilha**: 16 timbres de Guitarra (*Distortion High-Gain*, *Overdrive Crunch*, *Fuzz Square/Saw*, *Clean Strat*, *Jazz*, *Palm Mute*, *Harmônicos*), Violão (*Aço*, *Nylon*) e Contrabaixo (*Fingered*, *Picked*, *Slap*, *Fuzz Bass*, *Fretless*).
- **⚡ Pedaleira & Simulador de Amplificador em Tempo Real (Web Audio DSP)**:
  - **Pedal de Drive / Fuzz** com oversampling `4x` (*Clean*, *Tube Overdrive TS9*, *Heavy Distortion*, *Vintage Fuzz Big Muff*).
  - **Simulador de Caixa 4x12 (`Cab Sim`)** para resposta acústica de amplificador microfonado.
  - **Equalizador de 3 Bandas** (*Grave / Bass*, *Médio / Mid*, *Agudo / Treble* em `dB`).
  - **Chorus Estéreo**, **Delay com Feedback** e **Studio Hall Reverb** (Convolver Impulse Response).
  - **7 Presets de Estúdio** de 1 clique (*Estúdio Realista*, *Rock Crunch*, *Heavy Distortion*, *Solo Lead*, *Fuzz Psicodélico*, *Clean 80s*, *Bypass*).
- **🔎 Busca Online Instantânea (As-You-Type)**:
  - Pesquisa em tempo real em **+53.400 tablaturas Guitar Pro gratuitas** indexadas de repositórios públicos do GitHub (`AlexMi-Ha/GuitarTabs`, `aristides93/GuitarTabs`, `morishin/TAB`, `YetAnotherMorty/Guitar-Pro-Tabs`) com cache local em IndexedDB.
- **🔥 Ferramentas Avançadas de Estudo**:
  - **Speed Trainer (Acelerador Progressivo)**: Aumenta a velocidade automaticamente a cada `N` repetições do loop (ex.: `60%` → `100%`).
  - **Loop A–B por Compasso ou Seleção Visual** direto na partitura.
  - **Braço de Guitarra/Baixo 24 Casas em Tempo Real (`FretboardVisualizer`)**: Exibe exatamente as casas e cordas tocadas a cada batida.
  - **Transposição de Afinação (`-6` a `+6` semitons)** sem alterar o andamento.
  - **Afinador Cromático por Microfone (`ChromaticTuner`)** com detecção por autocorrelação + gerador de tons de referência.
  - **Leitor de PDF (`PdfViewer`)** com Auto-Scroll mãos-livres, Metrônomo integrado e Modo Noturno.
  - **Biblioteca Pessoal Persistente (`IndexedDB`)** que salva seus arquivos, favoritos, status de estudo e mixagem/pedaleira de cada música.

---

## 🏗️ Arquitetura SOLID

O projeto segue os 5 princípios **SOLID**:

- `src/domain/models.ts`: Modelos e tipos de domínio puros.
- `src/domain/contracts.ts`: Contratos segregados (`ITablatureRepository`, `ITabSearchProvider`, `IGuitarEffectsProcessor`, `IMetronomeEngine`, `IPitchDetector`, `IReferenceToneGenerator`).
- `src/services/`:
  - `audio/WebAudioGuitarEffectsRack.ts`: Cadeia DSP de pedaleira e amplificador de guitarra via Web Audio API.
  - `audio/WebAudioEngine.ts`: Implementações de metrônomo, detector de pitch e gerador de referência.
  - `alphatab/AlphaTabThemeService.ts`: Tematização clara/escura da partitura.
  - `libraryDb.ts`: Repositório IndexedDB (`IndexedDbTablatureRepository`).
  - `onlineTabSearch.ts`: Provedores de busca online (`GithubTreeTabSearchProvider`, `BuiltinCatalogSearchProvider`, `CompositeTabSearchService`).
- `src/hooks/`: Hooks de responsabilidade única (`useAutoScroll`, `useLibraryManager`, `usePlayerKeyboardShortcuts`).
- `src/components/`: Componentes coesos para o player Guitar Pro (`gp/GpTransportToolbar`, `gp/GuitarEffectsRackBar`, `gp/SpeedTrainerBar`, `gp/TrackMixerSidebar`), `PdfViewer`, `ChromaticTuner` e `LiveTabSearchBar`.

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```
