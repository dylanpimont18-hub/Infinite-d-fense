const SAVE_KEY = 'infinite_dfense_meta';

export default class MetaManager {
  constructor() {
    const saved = localStorage.getItem(SAVE_KEY);
    this.data = saved ? JSON.parse(saved) : { gems: 0, upgrades: {} };
  }

  save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  addGems(amount) {
    this.data.gems += amount;
    this.save();
  }

  reset() {
    this.data = { gems: 0, upgrades: {} };
    this.save();
  }
}
