class TemporalStateManager {
  constructor() {
    this.state = {};
  }

  saveState(key, value) {
    this.state[key] = value;
    console.log(`State saved: ${key} = ${JSON.stringify(value)}`);
  }

  loadState(key) {
    const value = this.state[key];
    console.log(`State loaded: ${key} = ${JSON.stringify(value)}`);
    return value;
  }

  clearState(key) {
    if (this.state[key]) {
      delete this.state[key];
      console.log(`State cleared: ${key}`);
    }
  }
}

module.exports = TemporalStateManager;
