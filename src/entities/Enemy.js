import Phaser from 'phaser';

import { MAP_PATH } from '../utils/path.js';

function playDeathEffect(scene, x, y, color) {
  const g = scene.add.graphics().setDepth(7);
  g.fillStyle(color, 0.8);
  g.fillCircle(x, y, 14);

  scene.tweens.add({
    targets: g,
    scaleX: 2.5,
    scaleY: 2.5,
    alpha: 0,
    duration: 200,
    ease: 'Sine.easeOut',
    onComplete: () => g.destroy(),
  });
}

export default class Enemy {
  constructor(scene, config, onReachBase, onDie) {
    this.scene      = scene;
    this.config     = config;
    this.hp         = config.hp;
    this.maxHp      = config.hp;
    this.speed      = config.speed;
    this.reward     = config.reward;
    this.alive      = true;
    this.slowFactor = 1;
    this.slowTimer  = null;
    this.regenTimer = null;

    this.waypointIndex = 1;

    const radius = config.isBoss ? 20 : 14;
    this.body = scene.add.circle(MAP_PATH[0].x, MAP_PATH[0].y, radius, config.color).setDepth(5);
    this.body.setStrokeStyle(config.isBoss ? 3 : 2, 0xffffff, 0.6);
    if (config.immuneToPhysical) this.body.setAlpha(0.65);

    this.hpGfx = scene.add.graphics().setDepth(6);

    this._onReachBase = onReachBase;
    this._onDie       = onDie;

    if (config.healRadius) {
      this.healEvent = scene.time.addEvent({
        delay: 2000, loop: true,
        callback: () => this.healNearby(),
      });
    }

    if (config.isBoss) {
      this.bossEvent = scene.time.addEvent({
        delay: 3500, loop: true,
        callback: () => this.triggerAbility(),
      });
    }

    this.moveToNext();
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }

  moveToNext() {
    if (!this.alive) return;
    if (this.waypointIndex >= MAP_PATH.length) { this.reachBase(); return; }

    const target   = MAP_PATH[this.waypointIndex];
    const dist     = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const duration = (dist / this.speed) * 1000;

    this.tween = this.scene.tweens.add({
      targets: this.body, x: target.x, y: target.y,
      duration, ease: 'Linear',
      onUpdate:   () => this.updateHpBar(),
      onComplete: () => {
        if (!this.alive) return;
        this.waypointIndex++;
        this.moveToNext();
      },
    });

    if (this.slowFactor !== 1) this.tween.timeScale = this.slowFactor;
  }

  updateHpBar() {
    if (!this.alive) return;
    const bw    = this.config.isBoss ? 40 : 28;
    const bh    = 4;
    const bx    = this.x - bw / 2;
    const by    = this.y - (this.config.isBoss ? 28 : 23);
    const ratio = Math.max(0, this.hp / this.maxHp);
    const color = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xf59e0b : 0xef4444;

    this.hpGfx.clear();
    this.hpGfx.fillStyle(0x000000, 0.65);
    this.hpGfx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    this.hpGfx.fillStyle(color, 1);
    this.hpGfx.fillRect(bx, by, bw * ratio, bh);
  }

  takeDamage(amount, damageType = 'physical') {
    if (!this.alive) return;
    if (this.config.immuneToPhysical && damageType === 'physical') return;

    this.hp -= amount;
    this.updateHpBar();

    // Troll : reset le timer de regen a chaque coup
    if (this.config.regenDelay) {
      if (this.regenTimer) this.regenTimer.remove();
      this.regenTimer = this.scene.time.delayedCall(this.config.regenDelay, () => {
        if (this.alive) {
          this.hp = Math.min(this.maxHp, this.hp + this.config.regenAmount);
          this.updateHpBar();
        }
      });
    }

    if (this.hp <= 0) this.die();
  }

  applySlowEffect(factor, duration) {
    if (!this.alive) return;
    if (this.slowTimer) this.slowTimer.remove();
    this.slowFactor = factor;
    if (this.tween) this.tween.timeScale = this.slowFactor;
    this.slowTimer = this.scene.time.delayedCall(duration, () => {
      this.slowFactor = 1;
      if (this.alive && this.tween) this.tween.timeScale = 1;
      this.slowTimer = null;
    });
  }

  healNearby() {
    if (!this.alive) return;
    const enemies = this.scene.waveManager?.getEnemies() ?? [];
    enemies.forEach(e => {
      if (e !== this && e.alive &&
          Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.config.healRadius) {
        e.hp = Math.min(e.maxHp, e.hp + this.config.healAmount);
        e.updateHpBar();
      }
    });
  }

  triggerAbility() {
    if (!this.alive) return;
    this.scene.events.emit('boss-ability', {
      x: this.x, y: this.y,
      name: this.config.name,
      radius: this.config.abilityRadius,
    });
  }

  die() {
    this.alive = false;
    playDeathEffect(this.scene, this.x, this.y, this.config.color);
    this.cleanup();
    this._onDie(this.reward, this.config);
  }

  reachBase() {
    this.alive = false;
    this.cleanup();
    this._onReachBase();
  }

  cleanup() {
    if (this.tween)      this.tween.stop();
    if (this.slowTimer)  this.slowTimer.remove();
    if (this.regenTimer) this.regenTimer.remove();
    if (this.healEvent)  this.healEvent.remove();
    if (this.bossEvent)  this.bossEvent.remove();
    this.body.destroy();
    this.hpGfx.destroy();
  }
}
