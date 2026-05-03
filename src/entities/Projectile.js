import Phaser from 'phaser';

function playCanonExplosion(scene, x, y, radius) {
  const g = scene.add.graphics().setDepth(5);
  g.lineStyle(4, 0xf97316, 0.9);
  g.strokeCircle(x, y, 8);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const ex = x + Math.cos(angle) * 12;
    const ey = y + Math.sin(angle) * 12;
    const tx = x + Math.cos(angle) * (radius * 0.6);
    const ty = y + Math.sin(angle) * (radius * 0.6);
    const shard = scene.add.graphics().setDepth(5);
    shard.lineStyle(2, 0xfbbf24, 0.85);
    shard.beginPath();
    shard.moveTo(ex, ey);
    shard.lineTo(tx, ty);
    shard.strokePath();
    scene.tweens.add({
      targets: shard,
      alpha: 0,
      duration: 280,
      ease: 'Sine.easeIn',
      onComplete: () => shard.destroy(),
    });
  }

  scene.tweens.add({
    targets: g,
    scaleX: radius / 8,
    scaleY: radius / 8,
    alpha: 0,
    duration: 300,
    ease: 'Sine.easeOut',
    onComplete: () => g.destroy(),
  });
}

function playFreezeRing(scene, x, y, radius) {
  const ring = scene.add.graphics().setDepth(5);
  ring.lineStyle(3, 0x67e8f9, 0.9);
  ring.strokeCircle(x, y, 6);

  const fill = scene.add.graphics().setDepth(5);
  fill.fillStyle(0xa5f3fc, 0.25);
  fill.fillCircle(x, y, radius);

  scene.tweens.add({
    targets: ring,
    scaleX: radius / 6,
    scaleY: radius / 6,
    alpha: 0,
    duration: 250,
    ease: 'Sine.easeOut',
    onComplete: () => ring.destroy(),
  });
  scene.tweens.add({
    targets: fill,
    alpha: 0,
    duration: 350,
    ease: 'Sine.easeOut',
    onComplete: () => fill.destroy(),
  });
}

export default class Projectile {
  constructor(scene, x, y, target, damage, splashRadius, getEnemies, damageType, slowFactor, slowDuration) {
    this.target       = target;
    this.damage       = damage;
    this.splashRadius = splashRadius;
    this.getEnemies   = getEnemies;
    this.damageType   = damageType  ?? 'physical';
    this.slowFactor   = slowFactor  ?? 0;
    this.slowDuration = slowDuration ?? 2000;

    // Couleur selon le type de degats
    const color = damageType === 'magic' ? 0x67e8f9 : 0xfbbf24;
    this.body = scene.add.circle(x, y, 5, color).setDepth(4);

    const dist     = Phaser.Math.Distance.Between(x, y, target.x, target.y);
    const duration = Math.max(50, (dist / 400) * 1000);

    scene.tweens.add({
      targets: this.body, x: target.x, y: target.y,
      duration, ease: 'Linear',
      onComplete: () => this.impact(),
    });
  }

  impact() {
    const px    = this.body.x;
    const py    = this.body.y;
    const scene = this.body.scene;

    if (this.splashRadius > 0) {
      if (this.damageType === 'physical') {
        playCanonExplosion(scene, px, py, this.splashRadius);
      } else if (this.damageType === 'magic' && this.slowFactor > 0) {
        playFreezeRing(scene, px, py, this.splashRadius);
      }
      this.getEnemies().forEach(e => {
        if (Phaser.Math.Distance.Between(px, py, e.x, e.y) <= this.splashRadius) {
          e.takeDamage(this.damage, this.damageType);
          if (this.slowFactor) e.applySlowEffect(this.slowFactor, this.slowDuration);
        }
      });
    } else {
      if (this.target.alive) {
        this.target.takeDamage(this.damage, this.damageType);
        if (this.slowFactor) this.target.applySlowEffect(this.slowFactor, this.slowDuration);
      }
    }
    this.body.destroy();
  }
}
