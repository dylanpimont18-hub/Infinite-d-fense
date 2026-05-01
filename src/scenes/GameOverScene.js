export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalWave = data.wave || 1;
    this.gems = data.gems || 0;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);

    this.add.text(width / 2, height * 0.3, 'GAME OVER', {
      fontSize: '40px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.45, `Vague atteinte : ${this.finalWave}`, {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.52, `Gemmes gagnées : ${this.gems}`, {
      fontSize: '22px',
      color: '#a855f7',
    }).setOrigin(0.5);

    const btnRetry = this.add.text(width / 2, height * 0.68, '[ Rejouer ]', {
      fontSize: '26px',
      color: '#ffffff',
      backgroundColor: '#2d6a2d',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnRetry.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });

    const btnMenu = this.add.text(width / 2, height * 0.78, '[ Menu ]', {
      fontSize: '22px',
      color: '#aaaaaa',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnMenu.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }
}
