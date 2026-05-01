export const WAVES = [
  // --- Cycle 1 ---
  { wave: 1,  enemies: [{ type: 'goblin',   count: 5,  interval: 1200 }] },
  { wave: 2,  enemies: [{ type: 'goblin',   count: 8,  interval: 1000 }] },
  { wave: 3,  enemies: [{ type: 'goblin',   count: 6,  interval: 1000 }, { type: 'orc',      count: 2, interval: 2000 }] },
  { wave: 4,  enemies: [{ type: 'orc',      count: 4,  interval: 1800 }] },
  { wave: 5,  enemies: [{ type: 'goblin',   count: 10, interval: 800  }, { type: 'orc',      count: 3, interval: 1800 }] },
  { wave: 6,  enemies: [{ type: 'ghost',    count: 5,  interval: 1200 }] },
  { wave: 7,  enemies: [{ type: 'goblin',   count: 8,  interval: 800  }, { type: 'ghost',    count: 4, interval: 1200 }] },
  { wave: 8,  enemies: [{ type: 'sorcerer', count: 3,  interval: 2000 }, { type: 'orc',      count: 5, interval: 1600 }] },
  { wave: 9,  enemies: [{ type: 'troll',    count: 3,  interval: 2500 }] },
  { wave: 10, enemies: [{ type: 'bossOgre', count: 1,  interval: 0    }, { type: 'goblin',   count: 10, interval: 700 }], boss: true },
  // --- Cycle 2 ---
  { wave: 11, enemies: [{ type: 'goblin',   count: 12, interval: 700  }, { type: 'ghost',    count: 6,  interval: 1000 }] },
  { wave: 12, enemies: [{ type: 'orc',      count: 6,  interval: 1500 }, { type: 'sorcerer', count: 3,  interval: 2000 }] },
  { wave: 13, enemies: [{ type: 'troll',    count: 4,  interval: 2000 }, { type: 'ghost',    count: 5,  interval: 1000 }] },
  { wave: 14, enemies: [{ type: 'goblin',   count: 15, interval: 600  }, { type: 'orc',      count: 5,  interval: 1500 }, { type: 'sorcerer', count: 3, interval: 2000 }] },
  { wave: 15, enemies: [{ type: 'bossLich', count: 1,  interval: 0    }, { type: 'sorcerer', count: 4,  interval: 1500 }], boss: true },
  { wave: 16, enemies: [{ type: 'troll',    count: 5,  interval: 2000 }, { type: 'ghost',    count: 8,  interval: 900  }] },
  { wave: 17, enemies: [{ type: 'goblin',   count: 20, interval: 500  }, { type: 'orc',      count: 8,  interval: 1400 }] },
  { wave: 18, enemies: [{ type: 'troll',    count: 6,  interval: 1800 }, { type: 'sorcerer', count: 5,  interval: 1800 }] },
  { wave: 19, enemies: [{ type: 'bossOgre', count: 1,  interval: 0    }, { type: 'troll',    count: 4,  interval: 2000 }, { type: 'ghost', count: 8, interval: 900 }] },
  { wave: 20, enemies: [{ type: 'bossOgre', count: 1,  interval: 0    }, { type: 'bossLich', count: 1,  interval: 8000 }, { type: 'goblin', count: 15, interval: 600 }], boss: true },
];
