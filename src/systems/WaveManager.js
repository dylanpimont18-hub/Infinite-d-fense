import { WAVES }   from '../data/waves.js';
import { ENEMIES } from '../data/enemies.js';
import Enemy       from '../entities/Enemy.js';

export default class WaveManager {
  constructor(scene, onWaveComplete, onBaseHit, onGoldEarned) {
    this.scene          = scene;
    this.onWaveComplete = onWaveComplete;
    this.onBaseHit      = onBaseHit;
    this.onGoldEarned   = onGoldEarned;

    this.currentWave  = 0;
    this.enemies      = [];
    this.pendingSpawns = 0;
    this.waveActive   = false;
  }

  startWave() {
    if (this.waveActive) return;
    this.currentWave++;
    this.waveActive   = true;
    this.enemies      = [];
    this.pendingSpawns = 0;

    const waveData = this.buildWaveData(this.currentWave);
    this.spawnWave(waveData);
  }

  // Pour les vagues au-delà de 10 : on cycle avec HP et count croissants
  buildWaveData(waveNum) {
    const base   = WAVES[(waveNum - 1) % WAVES.length];
    const tier   = Math.floor((waveNum - 1) / WAVES.length);
    const hpMult = 1 + tier * 0.5;
    const bonus  = tier * 2;

    return {
      ...base,
      enemies: base.enemies.map(g => ({ ...g, count: g.count + bonus, hpMult })),
    };
  }

  spawnWave(waveData) {
    this.pendingSpawns = waveData.enemies.reduce((s, g) => s + g.count, 0);
    let delay = 0;

    waveData.enemies.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        this.scene.time.delayedCall(delay + i * group.interval, () => {
          this.pendingSpawns--;
          this.spawnEnemy(group.type, group.hpMult || 1);
        });
      }
      delay += group.count * group.interval + 600;
    });
  }

  spawnEnemy(type, hpMult) {
    const base   = ENEMIES[type];
    const config = { ...base, hp: Math.round(base.hp * hpMult) };

    const enemy = new Enemy(
      this.scene,
      config,
      () => { this.removeEnemy(enemy); this.onBaseHit(); },
      (reward) => { this.removeEnemy(enemy); this.onGoldEarned(reward); },
    );
    this.enemies.push(enemy);
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
    this.checkWaveComplete();
  }

  checkWaveComplete() {
    if (this.pendingSpawns === 0 && this.enemies.length === 0 && this.waveActive) {
      this.waveActive = false;
      this.onWaveComplete(this.currentWave);
    }
  }

  getEnemies() {
    return this.enemies.filter(e => e.alive);
  }
}
