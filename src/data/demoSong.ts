// Built-in Catalog of Multi-Instrument Songs, Jams & Classical Public-Domain Arrangements
// Each entry uses AlphaTex with independent tracks (Lead Guitar, Rhythm Guitar, Bass)
// so the user can practice muting/soloing instruments right away.

export interface BuiltInCatalogSong {
  id: string;
  title: string;
  artist: string;
  genre: 'Rock' | 'Blues' | 'Metal' | 'Clássico' | 'Funk';
  bpm: number;
  instruments: string[];
  description: string;
  tex: string;
}

export const DEMO_ALPHATEX = `
\\title "Rock Jam em Mi Menor"
\\subtitle "Teste o Mute (M), Solo (S) e Volume de cada instrumento no painel lateral"
\\artist "LeitorTab Studio"
\\tempo 120

\\track "Guitarra Solo" "Gtr. Solo"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 30
:8 12.1 15.1 12.1 15.2 12.2 14.3 12.3 14.4 |
:4 12.3{v} 14.3{b(0 4 4 0)} :2 12.3{v} |
:8 15.2 12.2 15.1 12.1 17.1 15.1 19.1 17.1 |
:1 19.1{v} |
:8 12.1 15.1 14.1 12.1 15.2 12.2 14.3 12.3 |
:4 14.4 12.3 :2 14.3{v} |
:8 12.2 15.2 12.1 15.1 17.1 19.1 17.1 15.1 |
:1 12.1{v} |

\\track "Guitarra Base" "Gtr. Base"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 29
:8 (2.5 2.4 0.6){pm} (2.5 2.4 0.6){pm} (2.5 2.4 0.6) (2.5 2.4 0.6){pm} (5.5 5.4 3.6) (5.5 5.4 3.6) (7.5 7.4 5.6) (7.5 7.4 5.6) |
:8 (2.5 2.4 0.6){pm} (2.5 2.4 0.6){pm} (2.5 2.4 0.6) (2.5 2.4 0.6){pm} :4 (5.4 5.3 3.5) (7.4 7.3 5.5) |
:8 (2.5 2.4 0.6){pm} (2.5 2.4 0.6){pm} (2.5 2.4 0.6) (2.5 2.4 0.6){pm} (5.5 5.4 3.6) (5.5 5.4 3.6) (7.5 7.4 5.6) (7.5 7.4 5.6) |
:2 (5.4 5.3 3.5) (7.4 7.3 5.5) |
:8 (2.5 2.4 0.6){pm} (2.5 2.4 0.6){pm} (2.5 2.4 0.6) (2.5 2.4 0.6){pm} (5.5 5.4 3.6) (5.5 5.4 3.6) (7.5 7.4 5.6) (7.5 7.4 5.6) |
:8 (2.5 2.4 0.6){pm} (2.5 2.4 0.6){pm} (2.5 2.4 0.6) (2.5 2.4 0.6){pm} :4 (5.4 5.3 3.5) (7.4 7.3 5.5) |
:8 (5.4 5.3 3.5) (5.4 5.3 3.5) (5.4 5.3 3.5) (5.4 5.3 3.5) (7.4 7.3 5.5) (7.4 7.3 5.5) (7.4 7.3 5.5) (7.4 7.3 5.5) |
:1 (2.5 2.4 0.6) |

\\track "Contrabaixo" "Baixo"
\\staff{score tab} \\tuning G2 D2 A1 E1 \\instrument 33
:8 0.4 0.4 0.4 0.4 3.4 3.4 5.4 5.4 |
:8 0.4 0.4 0.4 0.4 :4 3.3 5.3 |
:8 0.4 0.4 0.4 0.4 3.4 3.4 5.4 5.4 |
:2 3.3 5.3 |
:8 0.4 0.4 0.4 0.4 3.4 3.4 5.4 5.4 |
:8 0.4 0.4 0.4 0.4 :4 3.3 5.3 |
:8 3.3 3.3 3.3 3.3 5.3 5.3 5.3 5.3 |
:1 0.4 |
`;

export const BUILTIN_CATALOG: BuiltInCatalogSong[] = [
  {
    id: 'catalog-rock-em',
    title: 'Rock Jam em Mi Menor',
    artist: 'LeitorTab Studio',
    genre: 'Rock',
    bpm: 120,
    instruments: ['Guitarra Solo', 'Guitarra Base', 'Contrabaixo'],
    description:
      'Jam de Rock em Em com frases na pentatônica, base em power chords com palm muting e linha de baixo.',
    tex: DEMO_ALPHATEX,
  },
  {
    id: 'catalog-blues-a',
    title: 'Texas Shuffle Blues em Lá',
    artist: 'LeitorTab Studio',
    genre: 'Blues',
    bpm: 108,
    instruments: ['Guitarra Blues Lead', 'Guitarra Shuffle', 'Walking Bass'],
    description:
      'Progressão clássica de Blues em Lá (I-IV-V) com frases de bend, riff shuffle clássico e walking bass.',
    tex: `
\\title "Texas Shuffle Blues em Lá"
\\subtitle "Mute a Guitarra Lead para improvisar em Lá Menor / Maior Pentatônica"
\\artist "LeitorTab Studio"
\\tempo 108

\\track "Guitarra Blues Lead" "Blues Lead"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 27
:4 5.1 :8 8.2 5.2 7.3{b(0 4 4 0)} 5.3 7.4 5.3 |
:2 7.4{v} :4 5.3 7.4 |
:8 5.2 8.2 5.1 8.1 5.1 8.2 7.3 5.3 |
:1 5.3{v} |
:4 7.3{b(0 4)} 5.2 8.2{b(0 4)} 5.1 |
:2 8.2{v} :8 5.2 7.3 5.3 7.4 |
:8 9.3 7.3 5.3 7.4 7.3 5.3 7.4 5.4 |
:1 7.4{v} |

\\track "Guitarra Shuffle" "Gtr. Shuffle"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 26
:8 (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) |
:8 (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) |
:8 (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) |
:8 (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) (2.4 0.5) (2.4 0.5) (4.4 0.5) (2.4 0.5) |
:8 (2.3 0.4) (2.3 0.4) (4.3 0.4) (2.3 0.4) (2.3 0.4) (2.3 0.4) (4.3 0.4) (2.3 0.4) |
:8 (2.3 0.4) (2.3 0.4) (4.3 0.4) (2.3 0.4) (2.3 0.4) (2.3 0.4) (4.3 0.4) (2.3 0.4) |
:8 (4.4 2.5) (4.4 2.5) (6.4 2.5) (4.4 2.5) (2.3 0.4) (2.3 0.4) (4.3 0.4) (2.3 0.4) |
:2 (2.4 0.5) (4.4 2.5) |

\\track "Walking Bass" "Baixo"
\\staff{score tab} \\tuning G2 D2 A1 E1 \\instrument 32
:4 0.3 4.3 2.2 4.2 |
:4 0.3 4.3 2.2 0.3 |
:4 0.3 4.3 2.2 4.2 |
:4 0.3 2.3 3.3 4.3 |
:4 0.2 4.2 2.1 4.1 |
:4 0.2 4.2 2.1 0.2 |
:4 2.2 1.2 0.2 4.3 |
:2 0.3 2.2 |
`,
  },
  {
    id: 'catalog-metal-dm',
    title: 'Melodic Metal Duel em Ré Menor',
    artist: 'LeitorTab Studio',
    genre: 'Metal',
    bpm: 145,
    instruments: ['Guitarra Lead 1', 'Guitarra Harmonia 2', 'Guitarra Riff Base', 'Contrabaixo'],
    description:
      'Dueto de guitarras em terças harmônicas no estilo Heavy Metal melódico com base pesada em Ré menor.',
    tex: `
\\title "Melodic Metal Duel em Ré Menor"
\\subtitle "Duas guitarras solando em terças + Guitarra Base + Contrabaixo"
\\artist "LeitorTab Studio"
\\tempo 145

\\track "Guitarra Lead 1" "Lead 1"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 30
:8 10.1 13.1 12.1 10.1 13.2 10.2 12.3 10.3 |
:4 12.4 10.3 :2 14.3{v} |
:8 13.1 17.1 15.1 13.1 15.2 13.2 14.3 12.3 |
:1 15.2{v} |

\\track "Guitarra Harmonia 2" "Harmonia 2"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 30
:8 6.1 10.1 8.1 6.1 10.2 6.2 9.3 7.3 |
:4 8.4 7.3 :2 10.3{v} |
:8 10.1 13.1 12.1 10.1 11.2 10.2 10.3 9.3 |
:1 10.2{v} |

\\track "Guitarra Riff Base" "Base Metal"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 29
:8 (7.3 7.4 5.5) 5.5{pm} 5.5{pm} 5.5{pm} (5.3 5.4 3.5) 3.5{pm} (3.3 3.4 1.5) 1.5{pm} |
:8 (7.3 7.4 5.5) 5.5{pm} 5.5{pm} 5.5{pm} :4 (3.3 3.4 1.5) (5.3 5.4 3.5) |
:8 (7.3 7.4 5.5) 5.5{pm} 5.5{pm} 5.5{pm} (10.3 10.4 8.5) 8.5{pm} (5.3 5.4 3.5) 3.5{pm} |
:1 (7.3 7.4 5.5) |

\\track "Contrabaixo" "Baixo"
\\staff{score tab} \\tuning G2 D2 A1 E1 \\instrument 34
:8 5.3 5.3 5.3 5.3 3.3 3.3 1.3 1.3 |
:8 5.3 5.3 5.3 5.3 :4 1.3 3.3 |
:8 5.3 5.3 5.3 5.3 8.3 8.3 3.3 3.3 |
:1 5.3 |
`,
  },
  {
    id: 'catalog-canon-rock',
    title: 'Canon em Ré Maior (Versão Rock)',
    artist: 'Johann Pachelbel (Domínio Público)',
    genre: 'Clássico',
    bpm: 100,
    instruments: ['Guitarra Solo', 'Guitarra Base (Acordes)', 'Contrabaixo'],
    description:
      'Arranjo multi-instrumentos da famosa progressão do Canon de Pachelbel para praticar arpejos e melodia.',
    tex: `
\\title "Canon em Ré Maior (Versão Rock)"
\\subtitle "Domínio Público — Melodia Principal, Base em Power Chords e Baixo"
\\artist "Johann Pachelbel"
\\tempo 100

\\track "Guitarra Solo" "Gtr. Solo"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 30
:2 14.1{v} 12.1{v} |
:2 10.1{v} 9.1{v} |
:2 7.1{v} 5.1{v} |
:2 7.1{v} 9.1{v} |
:4 10.1 9.1 10.1 5.1 |
:4 7.1 5.2 7.2 9.3 |
:8 7.2 10.2 9.2 7.2 7.3 6.3 7.3 9.3 |
:1 10.2{v} |

\\track "Guitarra Base" "Gtr. Base"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 29
:2 (7.3 7.4 5.5) (2.4 2.5 0.6) |
:2 (4.3 4.4 2.5) (4.4 4.5 2.6) |
:2 (5.4 5.5 3.6) (7.4 7.5 5.6) |
:2 (5.4 5.5 3.6) (2.4 2.5 0.6) |
:2 (7.3 7.4 5.5) (2.4 2.5 0.6) |
:2 (4.3 4.4 2.5) (4.4 4.5 2.6) |
:2 (5.4 5.5 3.6) (2.4 2.5 0.6) |
:1 (7.3 7.4 5.5) |

\\track "Contrabaixo" "Baixo"
\\staff{score tab} \\tuning G2 D2 A1 E1 \\instrument 33
:2 5.3 0.3 |
:2 2.3 2.4 |
:2 3.4 5.3 |
:2 3.4 0.3 |
:4 5.3 5.3 0.3 0.3 |
:4 2.3 2.3 2.4 2.4 |
:4 3.4 3.4 0.3 0.3 |
:1 5.3 |
`,
  },
  {
    id: 'catalog-bourree-bach',
    title: 'Bourrée em Mi Menor (BWV 996)',
    artist: 'J.S. Bach (Domínio Público)',
    genre: 'Clássico',
    bpm: 116,
    instruments: ['Violão / Guitarra (Voz Aguda)', 'Contrabaixo / Voz Grave'],
    description:
      'O clássico contraponto de J.S. Bach separado em duas trilhas independentes para você mutar a melodia ou o baixo!',
    tex: `
\\title "Bourrée em Mi Menor (BWV 996)"
\\subtitle "Contraponto separado em 2 trilhas: Voz Aguda e Voz Grave"
\\artist "Johann Sebastian Bach"
\\tempo 116

\\track "Voz Aguda (Melodia)" "Melodia"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 24
:8 0.1 2.1 |
:4 3.1 :8 2.1 0.1 :4 4.2 :8 0.1 2.1 |
:4 0.2 :8 2.2 4.2 :4 0.1 :8 2.2 0.2 |
:4 2.3 :8 0.3 2.3 :8 0.2 4.3 2.3 0.3 |
:2. 4.3 |

\\track "Voz Grave (Baixo)" "Baixo"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 25
:4 r |
:4 0.4 2.4 2.5 0.5 |
:4 3.5 2.5 0.5 3.5 |
:4 0.5 2.5 3.5 0.5 |
:4 2.5 0.5 2.6 |
`,
  },
  {
    id: 'catalog-funk-gm',
    title: 'Funk Groove & Slap Bass em Sol Menor',
    artist: 'LeitorTab Studio',
    genre: 'Funk',
    bpm: 112,
    instruments: ['Guitarra Funk Triads', 'Guitarra Lead Pentatônica', 'Slap Bass'],
    description:
      'Levada sincopada de Funk em Gm7 com tríades agudas na guitarra clean, frases solo e baixo grooveado.',
    tex: `
\\title "Funk Groove & Slap Bass em Sol Menor"
\\subtitle "Pratique levada rítmica Funk ou improvise sobre o Slap Bass"
\\artist "LeitorTab Studio"
\\tempo 112

\\track "Guitarra Funk Triads" "Funk Clean"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 27
:8 (3.1 3.2 3.3) (3.1 3.2 3.3) r (6.1 6.2 5.3) r (3.1 3.2 3.3) (5.1 5.2 5.3) (3.1 3.2 3.3) |
:8 (3.1 3.2 3.3) r (3.1 3.2 3.3) (6.1 6.2 5.3) :4 (5.1 5.2 5.3) (3.1 3.2 3.3) |
:8 (3.1 3.2 3.3) (3.1 3.2 3.3) r (6.1 6.2 5.3) r (3.1 3.2 3.3) (5.1 5.2 5.3) (3.1 3.2 3.3) |
:2 (8.1 8.2 7.3) (6.1 6.2 5.3) |

\\track "Guitarra Lead" "Gtr. Solo"
\\staff{score tab} \\tuning E4 B3 G3 D3 A2 E2 \\instrument 29
:4 3.1 :8 6.1 3.1 6.2 3.2 5.3 3.3 |
:2 5.4{v} :4 3.3 5.3 |
:8 3.2 6.2 3.1 6.1 8.1 6.1 10.1 8.1 |
:1 10.1{v} |

\\track "Slap Bass" "Baixo Funk"
\\staff{score tab} \\tuning G2 D2 A1 E1 \\instrument 36
:8 3.4 3.4 5.2 3.4 1.3 3.3 5.3 3.3 |
:8 3.4 3.4 5.2 3.4 :4 1.3 3.3 |
:8 3.4 3.4 5.2 3.4 1.3 3.3 5.3 3.3 |
:2 5.3 3.3 |
`,
  },
];
