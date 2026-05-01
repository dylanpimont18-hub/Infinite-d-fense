export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Fond placeholder
    this.add.rectangle(0, 0, width, height, 0x2d5a1b).setOrigin(0);

    this.add.text(width / 2, height / 2, 'GameScene\n(à construire)', {
      fontSize: '22px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Lance le HUD en parallèle
    this.scene.launch('UIScene');
  }
}
