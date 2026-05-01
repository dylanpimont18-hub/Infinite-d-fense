import { MAP_PATH } from '../utils/path.js';

export default class Enemy {
  constructor(scene, config, onReachBase, onDie) {
    this.scene    = scene;
    this.hp       = config.hp;
    this.maxHp    = config.hp;
    this.speed    = config.speed;
    this.reward   = config.reward;
    this.alive    = true;

    this.waypointIndex = 1;

    this.body  = scene.add.circle(MAP_PATH[0].x, MAP_PATH[0].y, 14, config.color).setDepth(5);
    this.body.setStrokeStyle(2, 0xffffff, 0.5);
    this.hpGfx = scene.add.graphics().setDepth(6);

    this._onReachBase = onReachBase;
    this._onDie       = onDie;

    this.moveToNext();
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }

  moveToNext() {
    if (!this.alive) return;
    if (this.waypointIndex >= MAP_PATH.length) {
      this.reachBase();
      return;
    }
    const target   = MAP_PATH[this.waypointIndex];
    const dist     = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const duration = (dist / this.speed) * 1000;

    this.tween = this.scene.tweens.add({
      targets:  this.body,
      x:        target.x,
      y:        target.y,
      duration,
      ease:     'Linear',
      onUpdate: () => this.updateHpBar(),
      onComplete: () => {
        if (!this.alive) return;
        this.waypointIndex++;
        this.moveToNext();
      },
    });
  }

  updateHpBar() {
    if (!this.alive) return;
    const bw    = 28;
    const bh    = 4;
    const bx    = this.x - bw / 2;
    const by    = this.y - 23;
    const ratio = Math.max(0, this.hp / this.maxHp);
    const color = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xf59e0b : 0xef4444;

    this.hpGfx.clear();
    this.hpGfx.fillStyle(0x000000, 0.65);
    this.hpGfx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    this.hpGfx.fillStyle(color, 1);
    this.hpGfx.fillRect(bx, by, bw * ratio, bh);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.updateHpBar();
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.cleanup();
    this._onDie(this.reward);
  }

  reachBase() {
    this.alive = false;
    this.cleanup();
    this._onReachBase();
  }

  cleanup() {
    if (this.tween) this.tween.stop();
    this.body.destroy();
    this.hpGfx.destroy();
  }
}
