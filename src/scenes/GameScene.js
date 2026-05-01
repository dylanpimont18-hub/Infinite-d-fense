import { MAP_PATH, TOWER_SLOTS } from '../utils/path.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.drawBackground();
    this.drawPath();
    this.drawTowerSlots();
    this.drawEntryMarker();
    this.drawBase();
    this.scene.launch('UIScene');
  }

  drawBackground() {
    const { width, height } = this.scale;

    // Fond herbe
    this.add.rectangle(0, 0, width, height, 0x2d5a1b).setOrigin(0);

    // Arbres décoratifs (cercles) placés hors du chemin
    const trees = [
      [28, 80], [160, 55], [310, 75], [448, 60],
      [28, 310], [448, 310],
      [28, 475], [448, 475],
      [28, 635], [448, 635],
      [80, 800], [400, 800],
    ];
    trees.forEach(([x, y]) => {
      this.add.circle(x, y + 6, 14, 0x14532d, 0.9);
      this.add.circle(x, y, 18, 0x166534, 0.85);
      this.add.circle(x - 4, y - 6, 12, 0x15803d, 0.8);
    });
  }

  drawPath() {
    // Ombre du chemin
    const shadow = this.add.graphics();
    shadow.lineStyle(40, 0x3d1f08, 0.85);
    this.tracePath(shadow);

    // Surface du chemin (terre)
    const dirt = this.add.graphics();
    dirt.lineStyle(30, 0x92651a, 1);
    this.tracePath(dirt);

    // Texture claire au centre
    const highlight = this.add.graphics();
    highlight.lineStyle(14, 0xb07c2a, 0.45);
    this.tracePath(highlight);
  }

  tracePath(g) {
    g.beginPath();
    g.moveTo(MAP_PATH[0].x, MAP_PATH[0].y);
    MAP_PATH.forEach(p => g.lineTo(p.x, p.y));
    g.strokePath();
  }

  drawTowerSlots() {
    TOWER_SLOTS.forEach((slot, i) => {
      const g = this.add.graphics();

      const draw = (hovered) => {
        g.clear();
        g.fillStyle(hovered ? 0x5a9b50 : 0x3a6b30, hovered ? 0.95 : 0.75);
        g.lineStyle(2, hovered ? 0xbbf7d0 : 0x86efac, 0.9);
        g.fillCircle(slot.x, slot.y, 20);
        g.strokeCircle(slot.x, slot.y, 20);
      };

      draw(false);

      this.add.text(slot.x, slot.y, '+', {
        fontSize: '18px',
        color: '#86efac',
      }).setOrigin(0.5);

      const zone = this.add.zone(slot.x, slot.y, 44, 44).setInteractive();
      zone.on('pointerover',  () => draw(true));
      zone.on('pointerout',   () => draw(false));
      zone.on('pointerdown',  () => this.onSlotClick(slot, i));
    });
  }

  drawEntryMarker() {
    // L'entrée est sur le bord gauche à y=200
    this.add.rectangle(0, 178, 78, 22, 0x000000, 0.65).setOrigin(0);
    this.add.text(39, 189, '>> ENTREE', {
      fontSize: '11px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  drawBase() {
    const { height } = this.scale;
    // La base est en bas au centre (fin du chemin à x=240)
    const bx = 240;
    const by = height - 44;

    this.add.rectangle(bx, by, 140, 50, 0x1e3a8a, 0.92).setOrigin(0.5);
    this.add.rectangle(bx, by, 136, 46, 0x1d4ed8, 0.35).setOrigin(0.5);
    this.add.text(bx, by, 'BASE  [20 PV]', {
      fontSize: '14px',
      color: '#e0f2fe',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  onSlotClick(slot, index) {
    // TODO etape 6 : ouvrir le menu de selection de tour
    console.log('Slot #' + index, slot);
  }
}
