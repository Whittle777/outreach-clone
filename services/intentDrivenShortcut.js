// services/intentDrivenShortcut.js

class IntentDrivenShortcut {
  constructor() {
    this.shortcuts = {};
  }

  addShortcut(intent, shortcut) {
    this.shortcuts[intent] = shortcut;
  }

  getShortcut(intent) {
    return this.shortcuts[intent];
  }
}

module.exports = new IntentDrivenShortcut();
