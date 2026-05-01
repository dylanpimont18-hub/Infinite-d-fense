export default class EconomyManager {
  constructor(startGold = 100) {
    this.gold = startGold;
  }

  add(amount) {
    this.gold += amount;
  }

  spend(amount) {
    if (amount > this.gold) return false;
    this.gold -= amount;
    return true;
  }
}
