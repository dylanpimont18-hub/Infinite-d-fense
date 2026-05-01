export default class Projectile {
  constructor(scene, x, y, target, damage, splashRadius, getEnemies) {
    this.target       = target;
    this.damage       = damage;
    this.splashRadius = splashRadius;
    this.getEnemies   = getEnemies;

    this.body = scene.add.circle(x, y, 5, 0xfbbf24).setDepth(4);

    const dist     = Phaser.Math.Distance.Between(x, y, target.x, target.y);
    const duration = Math.max(50, (dist / 400) * 1000);

    scene.tweens.add({
      targets:  this.body,
      x:        target.x,
      y:        target.y,
      duration,
      ease:     'Linear',
      onComplete: () => this.impact(),
    });
  }

  impact() {
    const px = this.body.x;
    const py = this.body.y;

    if (this.splashRadius > 0) {
      this.getEnemies().forEach(e => {
        if (Phaser.Math.Distance.Between(px, py, e.x, e.y) <= this.splashRadius) {
          e.takeDamage(this.damage);
        }
      });
    } else {
      if (this.target.alive) this.target.takeDamage(this.damage);
    }

    this.body.destroy();
  }
}
