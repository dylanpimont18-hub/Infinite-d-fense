export default class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 0;
  }

  nextWave() {
    this.currentWave++;
  }
}
