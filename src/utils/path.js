// Chemin fixe de la map V1 — coordonnées pour une résolution 480×854px
export const MAP_PATH = [
  { x: -40,  y: 200 },   // spawn (hors écran gauche)
  { x: 360,  y: 200 },
  { x: 360,  y: 360 },
  { x: 120,  y: 360 },
  { x: 120,  y: 520 },
  { x: 360,  y: 520 },
  { x: 360,  y: 680 },
  { x: 240,  y: 680 },
  { x: 240,  y: 900 },   // base (hors écran bas)
];

// Emplacements disponibles pour poser des tours
export const TOWER_SLOTS = [
  // Segment 1 — horizontal y=200 (x: 0 → 360)
  { x: 80,  y: 140 }, { x: 190, y: 140 }, { x: 295, y: 140 },
  { x: 80,  y: 260 }, { x: 190, y: 260 },

  // Descente droite x=360 (y: 200 → 360)
  { x: 415, y: 275 },

  // Segment 3 — horizontal y=360 (x: 360 → 120)
  { x: 245, y: 302 },
  { x: 175, y: 418 }, { x: 295, y: 418 },

  // Descente gauche x=120 (y: 360 → 520)
  { x: 62,  y: 438 },

  // Segment 5 — horizontal y=520 (x: 120 → 360)
  { x: 175, y: 462 }, { x: 295, y: 462 },
  { x: 175, y: 578 }, { x: 295, y: 578 },

  // Descente droite x=360 (y: 520 → 680)
  { x: 415, y: 598 },

  // Segment 7 — horizontal y=680 (x: 360 → 240)
  { x: 305, y: 632 },

  // Descente finale x=240 (y: 680 → 900)
  { x: 172, y: 758 }, { x: 308, y: 758 },
];
