import { MAP_PATH, TOWER_SLOTS } from '../utils/path.js';
import { TOWERS }        from '../data/towers.js';
import WaveManager       from '../systems/WaveManager.js';
import EconomyManager    from '../systems/EconomyManager.js';
import Tower             from '../entities/Tower.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.baseHp        = 20;
    this.waveHpLost    = false;
    this.placedTowers  = [];
    this.occupiedSlots = new Set();
    this.slotRefs      = [];
    this.towerPanel    = null;

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

  update(time) {
    if (!this.waveManager) return;
    const enemies = this.waveManager.getEnemies();
    this.placedTowers.forEach(({ tower }) => tower.update(time, enemies));
  }

  // ---- Gestion des vagues ----

  launchWave() {
    if (this.registry.get('waveState') === 'active') return;
    this.closeTowerPanel();
    this.waveHpLost = false;
    this.waveManager.startWave();
    this.registry.set('wave',      this.waveManager.currentWave);
    this.registry.set('waveState', 'active');
  }

  onWaveComplete() {
    if (!this.waveHpLost) this.onGoldEarned(30); // bonus vague parfaite
    this.registry.set('waveState', 'waiting');
  }

  onBaseHit() {
    this.waveHpLost = true;
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

  // ---- Placement et vente de tours ----

  onSlotClick(slot, index) {
    this.closeTowerPanel();
    if (this.occupiedSlots.has(index)) {
      this.showTowerInfo(slot, index);
    } else {
      this.showTowerPanel(slot, index);
    }
  }

  showTowerPanel(slot, index) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const elements = [];

    // Zone de fermeture arrière-plan
    const dismiss = this.add.rectangle(cx, cy, width, height, 0x000000, 0.01)
      .setInteractive().setDepth(9);
    dismiss.on('pointerdown', () => this.closeTowerPanel());
    elements.push(dismiss);

    elements.push(
      this.add.rectangle(cx, cy, 290, 195, 0x0f172a, 0.96)
        .setStrokeStyle(1, 0x334155).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy - 76, 'Placer une tour', {
        fontSize: '16px', color: '#e2e8f0', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10)
    );

    [
      { key: 'archer', label: 'Archer',  cost: '50 or'  },
      { key: 'canon',  label: 'Canon',   cost: '100 or' },
    ].forEach((opt, i) => {
      const bx  = cx - 70 + i * 140;
      const by  = cy - 10;
      const cfg = TOWERS[opt.key];
      const ok  = this.economy.gold >= cfg.cost;

      const btn = this.add.rectangle(bx, by, 122, 74, ok ? 0x1a3a1a : 0x1e2635, 0.95)
        .setStrokeStyle(1, ok ? 0x4ade80 : 0x374151).setDepth(10);
      elements.push(btn);
      elements.push(this.add.circle(bx, by - 18, 12, cfg.color).setDepth(10));
      elements.push(this.add.text(bx, by + 4, opt.label, {
        fontSize: '14px', color: ok ? '#f8fafc' : '#6b7280', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10));
      elements.push(this.add.text(bx, by + 22, opt.cost, {
        fontSize: '12px', color: ok ? '#fbbf24' : '#4b5563',
      }).setOrigin(0.5).setDepth(10));

      if (ok) {
        btn.setInteractive();
        btn.on('pointerdown', () => {
          this.closeTowerPanel();
          this.placeTower(slot, index, opt.key);
        });
      }
    });

    const cancel = this.add.text(cx, cy + 72, 'Annuler', {
      fontSize: '14px', color: '#94a3b8', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive().setDepth(10);
    cancel.on('pointerdown', () => this.closeTowerPanel());
    elements.push(cancel);

    this.towerPanel = { elements };
  }

  showTowerInfo(slot, index) {
    const entry = this.placedTowers.find(t => t.slotIndex === index);
    if (!entry) return;

    const cfg       = TOWERS[entry.towerKey];
    const sellPrice = Math.floor(cfg.cost * 0.5);
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const elements = [];

    const dismiss = this.add.rectangle(cx, cy, width, height, 0x000000, 0.01)
      .setInteractive().setDepth(9);
    dismiss.on('pointerdown', () => this.closeTowerPanel());
    elements.push(dismiss);

    elements.push(
      this.add.rectangle(cx, cy, 250, 155, 0x0f172a, 0.96)
        .setStrokeStyle(1, 0x334155).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy - 52, cfg.name, {
        fontSize: '17px', color: '#e2e8f0', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy - 24, `Degats : ${cfg.damage}   Portee : ${cfg.range}`, {
        fontSize: '13px', color: '#94a3b8',
      }).setOrigin(0.5).setDepth(10)
    );

    const sellBtn = this.add.text(cx, cy + 14, `Vendre  +${sellPrice} or`, {
      fontSize: '15px', color: '#fbbf24',
      backgroundColor: '#78350f', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setInteractive().setDepth(10);
    sellBtn.on('pointerdown', () => {
      this.closeTowerPanel();
      this.sellTower(index);
    });
    elements.push(sellBtn);

    const closeBtn = this.add.text(cx, cy + 56, 'Fermer', {
      fontSize: '13px', color: '#64748b', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive().setDepth(10);
    closeBtn.on('pointerdown', () => this.closeTowerPanel());
    elements.push(closeBtn);

    this.towerPanel = { elements };
  }

  closeTowerPanel() {
    if (!this.towerPanel) return;
    this.towerPanel.elements.forEach(e => e.destroy());
    this.towerPanel = null;
  }

  placeTower(slot, index, towerKey) {
    const cfg = TOWERS[towerKey];
    if (!this.economy.spend(cfg.cost)) return;
    this.registry.set('gold', this.economy.gold);

    this.occupiedSlots.add(index);

    const { g, label } = this.slotRefs[index];
    g.clear();
    label.setVisible(false);

    const tower = new Tower(this, slot.x, slot.y, cfg);
    this.placedTowers.push({ slotIndex: index, tower, slot, towerKey });
  }

  sellTower(index) {
    const entry = this.placedTowers.find(t => t.slotIndex === index);
    if (!entry) return;

    entry.tower.destroy();
    this.placedTowers  = this.placedTowers.filter(t => t.slotIndex !== index);
    this.occupiedSlots.delete(index);
    this.onGoldEarned(Math.floor(TOWERS[entry.towerKey].cost * 0.5));

    const { g, label } = this.slotRefs[index];
    g.clear();
    g.fillStyle(0x3a6b30, 0.75);
    g.lineStyle(2, 0x86efac, 0.9);
    g.fillCircle(entry.slot.x, entry.slot.y, 20);
    g.strokeCircle(entry.slot.x, entry.slot.y, 20);
    label.setVisible(true);
  }

  // ---- Dessin de la map ----

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
    this.slotRefs = [];
    TOWER_SLOTS.forEach((slot, i) => {
      const g = this.add.graphics();

      const draw = (hovered) => {
        if (this.occupiedSlots.has(i)) return;
        g.clear();
        g.fillStyle(hovered ? 0x5a9b50 : 0x3a6b30, hovered ? 0.95 : 0.75);
        g.lineStyle(2, hovered ? 0xbbf7d0 : 0x86efac, 0.9);
        g.fillCircle(slot.x, slot.y, 20);
        g.strokeCircle(slot.x, slot.y, 20);
      };
      draw(false);

      const label = this.add.text(slot.x, slot.y, '+', {
        fontSize: '18px', color: '#86efac',
      }).setOrigin(0.5);

      const zone = this.add.zone(slot.x, slot.y, 44, 44).setInteractive();
      zone.on('pointerover',  () => draw(true));
      zone.on('pointerout',   () => draw(false));
      zone.on('pointerdown',  () => this.onSlotClick(slot, i));

      this.slotRefs[i] = { g, label, zone };
    });
  }

  drawEntryMarker() {
    this.add.rectangle(0, 178, 78, 22, 0x000000, 0.65).setOrigin(0);
    this.add.text(39, 189, '>> ENTREE', {
      fontSize: '11px', color: '#facc15', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  drawBase() {
    const { height } = this.scale;
    const bx = 240;
    const by = height - 44;
    this.add.rectangle(bx, by, 140, 50, 0x1e3a8a, 0.92).setOrigin(0.5);
    this.add.rectangle(bx, by, 136, 46, 0x1d4ed8, 0.35).setOrigin(0.5);
    this.add.text(bx, by, 'BASE  [20 PV]', {
      fontSize: '14px', color: '#e0f2fe', fontStyle: 'bold',
    }).setOrigin(0.5);
  }
}
