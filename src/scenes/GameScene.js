import Phaser from 'phaser';
import { MAP_PATH, TOWER_SLOTS } from '../utils/path.js';
import { TOWERS } from '../data/towers.js';
import WaveManager from '../systems/WaveManager.js';
import EconomyManager from '../systems/EconomyManager.js';
import Tower from '../entities/Tower.js';
import { PREMIUM_THEME, createButton, createGlassPanel } from '../utils/premiumUI.js';

const PANEL_ROWS = [['archer', 'canon', 'iceMage'], ['barricade', 'lightning']];
const TOWER_PANEL_TONES = {
  archer: 'jade',
  canon: 'ember',
  iceMage: 'slate',
  barricade: 'plum',
  lightning: 'gold',
};
const PREP_DURATION = 12;
const DEFAULT_META = {
  damageMultiplier: 1,
  fireRateMultiplier: 1,
  baseHpBonus: 0,
  towerCostMultiplier: 1,
  startGoldBonus: 0,
  waveRewardMultiplier: 1,
  interestRate: 0,
};
const DEFAULT_SETTINGS = {
  autoStartWaves: true,
  showCombatLog: true,
  showSlotMarkers: true,
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const profile = this.game.metaManager?.getSnapshot() ?? {};

    this.metaModifiers = {
      ...DEFAULT_META,
      ...(profile.modifiers ?? {}),
    };
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(profile.settings ?? {}),
    };
    this.runStats = {
      score: 0,
      kills: 0,
      bossesKilled: 0,
      perfectWaves: 0,
      goldEarned: 0,
      baseHpLost: 0,
      startedAt: Date.now(),
    };

    this.baseHp = 20 + this.metaModifiers.baseHpBonus;
    this.waveHpLost = false;
    this.placedTowers = [];
    this.occupiedSlots = new Set();
    this.slotRefs = [];
    this.towerPanel = null;

    const startingGold = 150 + this.metaModifiers.startGoldBonus;

    this.registry.set('gold', startingGold);
    this.registry.set('baseHp', this.baseHp);
    this.registry.set('wave', 0);
    this.registry.set('waveState', 'waiting');
    this.registry.set('prepTime', PREP_DURATION);
    this.registry.set('score', 0);
    this.registry.set('kills', 0);
    this.registry.set('wavePreview', null);
    this.registry.set('notification', null);
    this.registry.set('gameSpeed', 1);

    this.economy = new EconomyManager(startingGold);

    this.drawBackground();
    this.drawPath();
    this.drawTowerSlots();
    this.drawEntryMarker();
    this.drawBase();

    this.waveManager = new WaveManager(
      this,
      () => this.onWaveComplete(),
      () => this.onBaseHit(),
      (gold) => this.onGoldEarned(gold),
      (enemyConfig, reward) => this.onEnemyDefeated(enemyConfig, reward),
    );

    this.events.on('boss-ability', this.handleBossAbility, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.setGameSpeed(1);

    this.scene.launch('UIScene');
    this.updateWavePreview();
    this.announce('Place tes tours puis lance la premiere vague.', 'info', true);
    this.startPreparationCountdown();
  }

  update(time) {
    if (!this.waveManager) return;
    const enemies = this.waveManager.getEnemies();
    this.placedTowers.forEach(({ tower }) => tower.update(time, enemies));
  }

  handleBossAbility({ x, y, name, radius }) {
    if (name === 'Liche') {
      this.waveManager.resurrectEnemy('goblin');
      this.announce('La liche releve un gobelin tombe.', 'boss', true);
      return;
    }

    this.placedTowers.forEach(({ tower }) => {
      if (Phaser.Math.Distance.Between(x, y, tower.x, tower.y) <= radius) {
        tower.disable(3000);
      }
    });
    this.announce('L ogre incendie les tours proches.', 'warn', true);
  }

  handleShutdown() {
    this.stopPreparationCountdown();
    this.closeTowerPanel();
    this.events.off('boss-ability', this.handleBossAbility, this);
  }

  launchWave() {
    if (this.registry.get('waveState') === 'active') return;

    const preview = this.waveManager.getWavePreview(this.waveManager.currentWave + 1);

    this.closeTowerPanel();
    this.waveHpLost = false;
    this.stopPreparationCountdown();
    this.registry.set('prepTime', 0);
    this.waveManager.startWave();
    this.registry.set('wave', this.waveManager.currentWave);
    this.registry.set('waveState', 'active');
    this.registry.set('wavePreview', {
      ...preview,
      title: `Combat  •  ${preview.title}`,
    });

    if (preview.boss) {
      this.announce(`Alerte boss : ${preview.summary}`, 'boss', true);
    } else {
      this.announce(`Vague ${preview.number} : ${preview.summary}`, 'info');
    }
  }

  onWaveComplete() {
    const currentWave = this.waveManager.currentWave;
    const bonusParts = [];

    if (!this.waveHpLost) {
      const perfectBonus = Math.round(30 * this.metaModifiers.waveRewardMultiplier);
      this.onGoldEarned(perfectBonus);
      this.runStats.perfectWaves += 1;
      this.addScore(150 + currentWave * 25);
      bonusParts.push(`Sans degats +${perfectBonus} or`);
    }

    const interest = Math.floor(this.economy.gold * this.metaModifiers.interestRate);
    if (interest > 0) {
      this.onGoldEarned(interest);
      bonusParts.push(`Interets +${interest} or`);
    }

    this.registry.set('waveState', 'waiting');
    this.updateWavePreview();

    const nextPreview = this.registry.get('wavePreview');
    if (nextPreview?.boss) {
      bonusParts.push(`Prochain boss : vague ${nextPreview.number}`);
    }

    if (bonusParts.length) {
      this.announce(bonusParts.join('  •  '), 'reward');
    } else {
      this.announce('Phase de preparation.', 'info');
    }

    this.startPreparationCountdown();
  }

  playBaseHitFlash() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.35).setDepth(20);
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 250,
      ease: 'Sine.easeOut',
      onComplete: () => overlay.destroy(),
    });
  }

  onBaseHit() {
    this.waveHpLost = true;
    this.runStats.baseHpLost += 1;
    this.baseHp -= 1;
    this.registry.set('baseHp', this.baseHp);
    this.cameras.main.shake(120, 0.0018);
    this.playBaseHitFlash();

    if (this.baseHpText) {
      this.baseHpText.setText(`${this.baseHp} PV`);
      this.baseHpText.setColor(this.baseHp <= 5 ? '#ffd2c5' : '#d8f5ff');
    }
    if (this.baseGlow) {
      this.baseGlow.setAlpha(0.82);
      this.tweens.add({
        targets: this.baseGlow,
        alpha: this.baseHp <= 5 ? 0.26 : 0.14,
        duration: 360,
        ease: 'Sine.easeOut',
      });
    }

    if (this.baseHp <= 5 && this.baseHp > 0) {
      this.announce('Base critique, renforce la defense.', 'warn', true);
    }

    if (this.baseHp <= 0) {
      this.stopPreparationCountdown();
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        summary: this.buildRunSummary(),
      });
    }
  }

  onGoldEarned(amount) {
    if (amount <= 0) return;
    this.economy.add(amount);
    this.runStats.goldEarned += amount;
    this.registry.set('gold', this.economy.gold);
  }

  onEnemyDefeated(enemyConfig, reward) {
    if (!enemyConfig) return;

    this.runStats.kills += 1;
    if (enemyConfig.isBoss) this.runStats.bossesKilled += 1;

    const scoreGain = enemyConfig.isBoss
      ? 500 + this.waveManager.currentWave * 40
      : Math.max(35, reward * 10 + this.waveManager.currentWave * 6);
    this.addScore(scoreGain);
    this.registry.set('kills', this.runStats.kills);

    if (enemyConfig.isBoss) {
      this.announce(`${enemyConfig.name} terrasse.`, 'boss', true);
    }
  }

  addScore(amount) {
    this.runStats.score = Math.max(0, this.runStats.score + amount);
    this.registry.set('score', this.runStats.score);
  }

  buildRunSummary() {
    const survivedSeconds = Math.max(1, Math.floor((Date.now() - this.runStats.startedAt) / 1000));
    const gems = Math.max(
      10,
      Math.round(this.runStats.score / 150 + this.waveManager.currentWave * 2 + this.runStats.perfectWaves * 3)
    );

    return {
      wave: this.waveManager.currentWave,
      score: this.runStats.score,
      kills: this.runStats.kills,
      bossesKilled: this.runStats.bossesKilled,
      perfectWaves: this.runStats.perfectWaves,
      goldEarned: this.runStats.goldEarned,
      survivedSeconds,
      gems,
    };
  }

  updateWavePreview() {
    this.registry.set('wavePreview', this.waveManager.getWavePreview(this.waveManager.currentWave + 1));
  }

  announce(text, tone = 'info', force = false) {
    if (!force && !this.settings.showCombatLog) return;
    this.registry.set('notification', {
      id: Date.now() + Math.random(),
      text,
      tone,
    });
  }

  setGameSpeed(multiplier) {
    this.gameSpeed = multiplier;
    this.time.timeScale = multiplier;
    this.tweens.timeScale = multiplier;
    this.registry.set('gameSpeed', multiplier);
  }

  cycleGameSpeed() {
    const nextSpeed = this.gameSpeed === 1 ? 2 : 1;
    this.setGameSpeed(nextSpeed);
    this.announce(`Vitesse x${nextSpeed}`, 'info');
  }

  startPreparationCountdown() {
    this.stopPreparationCountdown();

    let remaining = PREP_DURATION;
    this.registry.set('prepTime', remaining);

    this.prepCountdown = this.time.addEvent({
      delay: 1000,
      repeat: PREP_DURATION - 1,
      callback: () => {
        if (this.registry.get('waveState') !== 'waiting') return;

        remaining -= 1;
        this.registry.set('prepTime', remaining);

        if (remaining <= 0 && this.settings.autoStartWaves) {
          this.launchWave();
        } else if (remaining <= 0) {
          this.announce('Prochaine vague prete. Lance-la quand tu veux.', 'info');
        }
      },
    });
  }

  stopPreparationCountdown() {
    if (!this.prepCountdown) return;
    this.prepCountdown.remove();
    this.prepCountdown = null;
  }

  getTowerPlacementCost(towerKey) {
    return Math.max(35, Math.round(TOWERS[towerKey].cost * this.metaModifiers.towerCostMultiplier));
  }

  onSlotClick(slot, index) {
    if (this.registry.get('waveState') === 'active') return;

    this.closeTowerPanel();
    if (this.occupiedSlots.has(index)) {
      this.showTowerInfo(slot, index);
    } else {
      this.showTowerPanel(slot, index);
    }
  }

  createPanelDismissZones(cx, cy, panelWidth, panelHeight, elements) {
    const { width, height } = this.scale;
    const halfWidth = panelWidth / 2;
    const halfHeight = panelHeight / 2;
    const zones = [
      { x: width / 2, y: (cy - halfHeight) / 2, width, height: Math.max(0, cy - halfHeight) },
      {
        x: width / 2,
        y: cy + halfHeight + Math.max(0, height - (cy + halfHeight)) / 2,
        width,
        height: Math.max(0, height - (cy + halfHeight)),
      },
      { x: (cx - halfWidth) / 2, y: cy, width: Math.max(0, cx - halfWidth), height: panelHeight },
      {
        x: cx + halfWidth + Math.max(0, width - (cx + halfWidth)) / 2,
        y: cy,
        width: Math.max(0, width - (cx + halfWidth)),
        height: panelHeight,
      },
    ];

    zones
      .filter(zone => zone.width > 0 && zone.height > 0)
      .forEach(zone => {
        const dismiss = this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0x000000, 0.01)
          .setInteractive()
          .setDepth(9);
        dismiss.on('pointerdown', () => this.closeTowerPanel());
        elements.push(dismiss);
      });
  }

  showTowerPanel(slot, index) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const elements = [];
    const panelWidth = 360;
    const panelHeight = 292;

    this.createPanelDismissZones(cx, cy, panelWidth, panelHeight, elements);

    const panel = createGlassPanel(this, cx, cy, panelWidth, panelHeight, {
      fill: 0x081715,
      stroke: 0x2f6c59,
      glow: 0xf4c872,
      sheen: 0x2f6c59,
      headerText: 'Arsenal instantane',
      headerWidth: 168,
      depth: 10,
    });
    elements.push(panel.container);
    elements.push(
      this.add.text(cx, cy - 102, 'Choisis une tour a poser pendant la phase de preparation.', {
        fontFamily: PREMIUM_THEME.fonts.body,
        fontSize: '12px',
        color: '#bdd0ca',
        align: 'center',
        wordWrap: { width: 300 },
        fontStyle: '600',
      }).setOrigin(0.5).setDepth(10)
    );

    PANEL_ROWS.forEach((row, rowIdx) => {
      const by = cy - 30 + rowIdx * 92;
      const span = (row.length - 1) * 112;

      row.forEach((key, colIdx) => {
        const bx = cx - span / 2 + colIdx * 112;
        const cfg = TOWERS[key];
        const cost = this.getTowerPlacementCost(key);
        const ok = this.economy.gold >= cost;

        const button = createButton(this, bx, by, 102, 84, cfg.name, {
          subtitle: `${cost} or`,
          fontSize: 12,
          subtitleSize: 10,
          tone: TOWER_PANEL_TONES[key] ?? 'jade',
          depth: 10,
          onClick: () => {
            if (!ok) return;
            this.closeTowerPanel();
            this.placeTower(slot, index, key);
          },
        });
        if (!ok) button.setEnabled(false);

        const orb = this.add.circle(bx, by - 28, 11, cfg.color)
          .setStrokeStyle(2, 0xffffff, 0.35)
          .setDepth(11);
        elements.push(button.container, orb);
      });
    });

    const cancel = createButton(this, cx, cy + 118, 152, 40, 'Fermer', {
      tone: 'slate',
      fontSize: 14,
      depth: 10,
      onClick: () => this.closeTowerPanel(),
    });
    elements.push(cancel.container);

    this.towerPanel = { elements };
  }

  showTowerInfo(slot, index) {
    const entry = this.placedTowers.find(towerEntry => towerEntry.slotIndex === index);
    if (!entry) return;

    const info = entry.tower.getInfo();
    const sellPrice = info.sellPrice;
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const options = info.nextUpgrades;
    const panelHeight = 246 + options.length * 58;
    const elements = [];

    this.createPanelDismissZones(cx, cy, 320, panelHeight, elements);

    const panel = createGlassPanel(this, cx, cy, 320, panelHeight, {
      fill: 0x081715,
      stroke: 0x497393,
      glow: 0xd8f5ff,
      sheen: 0x2f6c59,
      headerText: 'Inspection de tour',
      headerWidth: 156,
      depth: 10,
    });
    elements.push(panel.container);
    elements.push(
      this.add.text(cx, cy - panelHeight / 2 + 28, info.name, {
        fontFamily: PREMIUM_THEME.fonts.display,
        fontSize: '24px', color: '#f7efd9', fontStyle: '700',
      }).setOrigin(0.5).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy - panelHeight / 2 + 56, info.description, {
        fontFamily: PREMIUM_THEME.fonts.body,
        fontSize: '12px', color: '#bdd0ca', align: 'center', wordWrap: { width: 260 }, fontStyle: '600',
      }).setOrigin(0.5).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy - 36, `Degats : ${info.damage}   Portee : ${info.range}`, {
        fontFamily: PREMIUM_THEME.fonts.body,
        fontSize: '13px', color: '#e0ebe8', fontStyle: '700',
      }).setOrigin(0.5).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy - 12,
        `Cadence : ${info.fireRate ? (1000 / info.fireRate).toFixed(1) + '/s' : 'Aura'}   Niveau : ${info.tier}`,
        {
          fontFamily: PREMIUM_THEME.fonts.body,
          fontSize: '13px', color: '#d2dfdb', fontStyle: '600',
        }
      ).setOrigin(0.5).setDepth(10)
    );
    elements.push(
      this.add.text(cx, cy + 12, `Voie active : ${info.branchName ?? 'Aucune'}`, {
        fontFamily: PREMIUM_THEME.fonts.body,
        fontSize: '13px', color: '#d6e9ff', fontStyle: '700',
      }).setOrigin(0.5).setDepth(10)
    );

    if (options.length) {
      options.forEach((option, optionIndex) => {
        const oy = cy + 56 + optionIndex * 56;
        const canAfford = this.economy.gold >= option.cost;
        const button = createButton(this, cx, oy, 264, 44, option.name, {
          subtitle: `${option.label}  •  ${option.cost} or`,
          fontSize: 14,
          subtitleSize: 10,
          tone: 'jade',
          depth: 10,
          onClick: () => {
            if (!canAfford) return;
            this.closeTowerPanel();
            this.upgradeTower(index, option.key, option.cost);
          },
        });
        if (!canAfford) button.setEnabled(false);
        elements.push(button.container);
      });
    } else {
      elements.push(
        this.add.text(cx, cy + 60, 'Specialisation complete', {
          fontFamily: PREMIUM_THEME.fonts.body,
          fontSize: '13px', color: '#bdfad7', fontStyle: '700',
        }).setOrigin(0.5).setDepth(10)
      );
    }

    const sellBtn = createButton(this, cx, cy + panelHeight / 2 - 58, 186, 42, `Vendre pour ${sellPrice} or`, {
      tone: 'gold',
      fontSize: 14,
      depth: 10,
      onClick: () => {
        this.closeTowerPanel();
        this.sellTower(index);
      },
    });
    const closeBtn = createButton(this, cx, cy + panelHeight / 2 - 12, 136, 38, 'Fermer', {
      tone: 'slate',
      fontSize: 13,
      depth: 10,
      onClick: () => this.closeTowerPanel(),
    });
    elements.push(sellBtn.container, closeBtn.container);

    this.towerPanel = { elements };
  }

  closeTowerPanel() {
    if (!this.towerPanel) return;
    this.towerPanel.elements.forEach(element => element.destroy());
    this.towerPanel = null;
  }

  placeTower(slot, index, towerKey) {
    const cfg = TOWERS[towerKey];
    const cost = this.getTowerPlacementCost(towerKey);
    if (!this.economy.spend(cost)) return;

    this.registry.set('gold', this.economy.gold);
    this.occupiedSlots.add(index);

    const { g, label } = this.slotRefs[index];
    g.clear();
    label.setVisible(false);

    const tower = new Tower(this, slot.x, slot.y, cfg, {
      metaModifiers: this.metaModifiers,
      placementCost: cost,
    });
    this.placedTowers.push({ slotIndex: index, tower, slot, towerKey });
  }

  upgradeTower(index, branchKey, cost) {
    const entry = this.placedTowers.find(towerEntry => towerEntry.slotIndex === index);
    if (!entry || !this.economy.spend(cost)) return;

    if (!entry.tower.upgrade(branchKey, cost)) {
      this.economy.add(cost);
    }

    this.registry.set('gold', this.economy.gold);
  }

  sellTower(index) {
    const entry = this.placedTowers.find(towerEntry => towerEntry.slotIndex === index);
    if (!entry) return;

    entry.tower.destroy();
    this.placedTowers = this.placedTowers.filter(towerEntry => towerEntry.slotIndex !== index);
    this.occupiedSlots.delete(index);
    this.onGoldEarned(entry.tower.getSellValue());

    const { draw, label } = this.slotRefs[index];
    draw(false);
    label.setVisible(this.settings.showSlotMarkers);
  }

  drawBackground() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x08140f).setOrigin(0);

    const strata = this.add.graphics();
    for (let row = 0; row < height; row += 18) {
      const color = row < height * 0.54 ? 0x0c2018 : 0x102720;
      strata.fillStyle(color, 0.28 + (row / height) * 0.14);
      strata.fillRect(0, row, width, 18);
    }

    const glows = this.add.graphics();
    [
      [width * 0.18, height * 0.18, 170, 120, 0x174838, 0.26],
      [width * 0.82, height * 0.22, 180, 140, 0x12364a, 0.2],
      [width * 0.62, height * 0.82, 250, 190, 0x5f3b18, 0.18],
    ].forEach(([x, y, rx, ry, color, alpha]) => {
      glows.fillStyle(color, alpha);
      glows.fillEllipse(x, y, rx, ry);
    });

    const trees = this.add.graphics();
    [
      [24, 78, 18], [118, 58, 16], [176, 90, 20], [286, 64, 18], [420, 74, 22],
      [26, 262, 18], [454, 286, 22], [34, 470, 18], [448, 514, 20], [22, 668, 20],
      [458, 706, 24], [88, 804, 18], [398, 810, 20],
    ].forEach(([x, y, radius]) => {
      trees.fillStyle(0x0f2f22, 0.95);
      trees.fillCircle(x, y + 8, radius + 2);
      trees.fillStyle(0x174838, 0.88);
      trees.fillCircle(x, y, radius);
      trees.fillStyle(0x2f6c59, 0.55);
      trees.fillCircle(x - 5, y - 6, Math.max(8, radius - 5));
    });
  }

  drawPath() {
    const shadow = this.add.graphics();
    shadow.lineStyle(48, 0x2b1607, 0.82);
    this.tracePath(shadow);

    const edge = this.add.graphics();
    edge.lineStyle(36, 0x5d3610, 0.95);
    this.tracePath(edge);

    const dirt = this.add.graphics();
    dirt.lineStyle(28, 0x9a6c2c, 1);
    this.tracePath(dirt);

    const highlight = this.add.graphics();
    highlight.lineStyle(10, 0xe1c07c, 0.34);
    this.tracePath(highlight);
  }

  tracePath(g) {
    g.beginPath();
    g.moveTo(MAP_PATH[0].x, MAP_PATH[0].y);
    MAP_PATH.forEach(point => g.lineTo(point.x, point.y));
    g.strokePath();
  }

  drawTowerSlots() {
    this.slotRefs = [];
    TOWER_SLOTS.forEach((slot, index) => {
      const g = this.add.graphics();
      const draw = (hovered) => {
        if (this.occupiedSlots.has(index)) return;
        g.clear();
        g.fillStyle(hovered ? 0x184d3f : 0x102d25, hovered ? 0.96 : 0.84);
        g.lineStyle(2, hovered ? 0xf4c872 : 0x78f2bf, 0.92);
        g.fillCircle(slot.x, slot.y, 19);
        g.strokeCircle(slot.x, slot.y, 19);
        g.lineStyle(1, hovered ? 0xffefc1 : 0x90b6c6, 0.72);
        g.strokeCircle(slot.x, slot.y, 25);
        g.strokeTriangle(slot.x, slot.y - 11, slot.x + 11, slot.y, slot.x, slot.y + 11);
        g.strokeTriangle(slot.x, slot.y - 11, slot.x - 11, slot.y, slot.x, slot.y + 11);
      };
      draw(false);

      const label = this.add.text(slot.x, slot.y, '+', {
        fontFamily: PREMIUM_THEME.fonts.body,
        fontSize: '18px', color: '#f4f9f7', fontStyle: '700',
      }).setOrigin(0.5).setVisible(this.settings.showSlotMarkers);
      this.tweens.add({
        targets: label,
        alpha: { from: 0.42, to: 0.96 },
        scaleX: { from: 0.96, to: 1.08 },
        scaleY: { from: 0.96, to: 1.08 },
        duration: 1050,
        yoyo: true,
        repeat: -1,
        delay: index * 35,
      });

      const zone = this.add.zone(slot.x, slot.y, 44, 44).setInteractive();
      zone.on('pointerover', () => draw(true));
      zone.on('pointerout', () => draw(false));
      zone.on('pointerdown', () => this.onSlotClick(slot, index));

      this.slotRefs[index] = { g, label, zone, draw };
    });
  }

  drawEntryMarker() {
    const frame = this.add.graphics();
    frame.fillStyle(0x081715, 0.9);
    frame.fillRoundedRect(12, 166, 116, 34, 16);
    frame.lineStyle(1, 0xf4c872, 0.8);
    frame.strokeRoundedRect(12, 166, 116, 34, 16);
    this.add.text(70, 183, '>> ENTREE', {
      fontFamily: PREMIUM_THEME.fonts.body,
      fontSize: '11px', color: '#f8e4a5', fontStyle: '700',
    }).setOrigin(0.5);
  }

  drawBase() {
    const { height } = this.scale;
    const bx = 240;
    const by = height - 48;
    this.baseMarker = this.add.container(bx, by).setDepth(2);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.36);
    shadow.fillRoundedRect(-90, -30, 180, 62, 24);

    this.baseGlow = this.add.graphics();
    this.baseGlow.fillStyle(0x497393, 0.14);
    this.baseGlow.fillRoundedRect(-84, -24, 168, 50, 20);

    const frame = this.add.graphics();
    frame.fillStyle(0x10202b, 0.95);
    frame.fillRoundedRect(-84, -24, 168, 50, 20);
    frame.lineStyle(2, 0xd8f5ff, 0.28);
    frame.strokeRoundedRect(-84, -24, 168, 50, 20);

    const sigil = this.add.circle(-54, 0, 18, 0x173544, 0.88)
      .setStrokeStyle(2, 0xd8f5ff, 0.42);
    const sigilCore = this.add.circle(-54, 0, 7, 0xd8f5ff, 0.78);
    const baseLabel = this.add.text(18, -8, 'BASTION', {
      fontFamily: PREMIUM_THEME.fonts.body,
      fontSize: '12px',
      color: '#c8dbff',
      fontStyle: '700',
    }).setOrigin(0.5);
    this.baseHpText = this.add.text(18, 12, `${this.baseHp} PV`, {
      fontFamily: PREMIUM_THEME.fonts.body,
      fontSize: '13px',
      color: '#d8f5ff',
      fontStyle: '700',
    }).setOrigin(0.5);

    this.baseMarker.add([shadow, this.baseGlow, frame, sigil, sigilCore, baseLabel, this.baseHpText]);
  }
}
