import { MAP_PATH, TOWER_SLOTS } from '../utils/path.js';
import WaveManager   from '../systems/WaveManager.js';
import EconomyManager from '../systems/EconomyManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.baseHp = 20;

    this.registry.set('gold',      150);
    this.registry.set('baseHp',    this.baseHp);
    this.registry.set('wave',      0);
    this.registry.set('waveState', 'waiting');

    this.economy = new EconomyManager(150);

    this.drawBackground();
    this.drawPath();
    this.drawTowerSlots();
    this.drawEntryMarker();
    this.drawBase();

    this.waveManager = new WaveManager(
      this,
      ()     => this.onWaveComplete(),
      ()     => this.onBaseHit(),
      (gold) => this.onGoldEarned(gold),
    );

    this.scene.launch('UIScene');
  }

  launchWave() {
    if (this.registry.get('waveState') === 'active') return;
    this.waveManager.startWave();
    this.registry.set('wave',      this.waveManager.currentWave);
    this.registry.set('waveState', 'active');
  }

  onWaveComplete() {
    this.registry.set('waveState', 'waiting');
  }

  onBaseHit() {
    this.baseHp--;
    this.registry.set('baseHp', this.baseHp);
    if (this.baseHp <= 0) {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        wave: this.waveManager.currentWave,
        gems: this.waveManager.currentWave * 10,
      });
    }
  }

  onGoldEarned(amount) {
    this.economy.add(amount);
    this.registry.set('gold', this.economy.gold);
  }

  // ---- Dessin de la map (identique à l'étape 3) ----

  drawBackground() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x2d5a1b).setOrigin(0);
    const trees = [
      [28, 80],  [160, 55], [310, 75], [448, 60],
      [28, 310], [448, 310],
      [28, 475], [448, 475],
      [28, 635], [448, 635],
      [80, 800], [400, 800],
    ];
    trees.forEach(([x, y]) => {
      this.add.circle(x, y + 6, 14, 0x14532d, 0.9);
      this.add.circle(x, y,     18, 0x166534, 0.85);
      this.add.circle(x - 4, y - 6, 12, 0x15803d, 0.8);
    });
  }

  drawPath() {
    const shadow = this.add.graphics();
    shadow.lineStyle(40, 0x3d1f08, 0.85);
    this.tracePath(shadow);

    const dirt = this.add.graphics();
    dirt.lineStyle(30, 0x92651a, 1);
    this.tracePath(dirt);

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
    this.add.rectangle(0, 178, 78, 22, 0x000000, 0.65).setOrigin(0);
    this.add.text(39, 189, '>> ENTREE', {
      fontSize: '11px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  drawBase() {
    const { height } = this.scale;
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
