export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Barre HUD supérieure
    this.add.rectangle(0, 0, width, 52, 0x000000, 0.75).setOrigin(0);

    const gold   = this.registry.get('gold')   ?? 150;
    const baseHp = this.registry.get('baseHp') ?? 20;
    const wave   = this.registry.get('wave')   ?? 0;

    this.goldText = this.add.text(12, 15, 'Or: ' + gold, {
      fontSize: '17px',
      color: '#fbbf24',
      fontStyle: 'bold',
    });

    this.hpText = this.add.text(width / 2, 15, 'Base: ' + baseHp + ' PV', {
      fontSize: '17px',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.waveText = this.add.text(width - 12, 15, 'Vague: ' + wave, {
      fontSize: '17px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Bouton lancer la vague
    this.launchBtn = this.add.text(width / 2, height - 90, '[ Lancer la vague ]', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#15803d',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.launchBtn.on('pointerdown', () => {
      this.scene.get('GameScene').launchWave();
    });

    // Réactivité au registre
    this.registry.events.on('changedata', (_p, key, value) => {
      if (key === 'gold')      this.goldText.setText('Or: ' + value);
      if (key === 'baseHp')    this.hpText.setText('Base: ' + value + ' PV');
      if (key === 'wave')      this.waveText.setText('Vague: ' + value);
      if (key === 'waveState') this.onWaveStateChange(value);
    }, this);
  }

  onWaveStateChange(state) {
    if (state === 'active') {
      this.launchBtn.setText('Vague en cours...');
      this.launchBtn.setStyle({ backgroundColor: '#374151', color: '#6b7280' });
    } else {
      this.launchBtn.setText('[ Lancer la vague ]');
      this.launchBtn.setStyle({ backgroundColor: '#15803d', color: '#ffffff' });
    }
  }
}
