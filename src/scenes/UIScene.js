export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width } = this.scale;

    // Barre HUD en haut
    this.add.rectangle(0, 0, width, 50, 0x000000, 0.7).setOrigin(0);

    this.goldText = this.add.text(16, 14, 'Or: 100', {
      fontSize: '18px',
      color: '#f0c040',
    });

    this.hpText = this.add.text(width / 2, 14, 'Base: 20 PV', {
      fontSize: '18px',
      color: '#ff4444',
    }).setOrigin(0.5, 0);

    this.waveText = this.add.text(width - 16, 14, 'Vague: 1', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(1, 0);
  }
}
