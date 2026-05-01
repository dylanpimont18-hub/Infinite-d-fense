export default class Projectile {
  constructor(scene, x, y, target, damage) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;
  }
}
