export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    this.add.text(width / 2, height * 0.25, 'Infinite D-fense', {
      fontSize: '36px',
      color: '#f0c040',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.38, 'Tower Defense Fantaisie', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const btnPlay = this.add.text(width / 2, height * 0.55, '[ Jouer ]', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#2d6a2d',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnPlay.on('pointerdown', () => this.scene.start('GameScene'));
    btnPlay.on('pointerover', () => btnPlay.setStyle({ color: '#f0c040' }));
    btnPlay.on('pointerout', () => btnPlay.setStyle({ color: '#ffffff' }));
  }
}
