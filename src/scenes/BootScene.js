export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Chargement des assets (images, sons) — à compléter
  }

  create() {
    this.scene.start('MenuScene');
  }
}
