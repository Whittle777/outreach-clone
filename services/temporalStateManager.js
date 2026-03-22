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

  saveAudioFileStorageState(prospectId, audioFileUrl) {
    const key = `audioFileStorage_${prospectId}`;
    this.saveState(key, audioFileUrl);
  }

  loadAudioFileStorageState(prospectId) {
    const key = `audioFileStorage_${prospectId}`;
    return this.loadState(key);
  }

  clearAudioFileStorageState(prospectId) {
    const key = `audioFileStorage_${prospectId}`;
    this.clearState(key);
  }

  saveStirShakenValidationResult(prospectId, validationResult) {
    const key = `stirShakenValidation_${prospectId}`;
    this.saveState(key, validationResult);
  }

  loadStirShakenValidationResult(prospectId) {
    const key = `stirShakenValidation_${prospectId}`;
    return this.loadState(key);
  }

  clearStirShakenValidationResult(prospectId) {
    const key = `stirShakenValidation_${prospectId}`;
    this.clearState(key);
  }

  saveRateLimitState(phoneNumber, rateLimitData) {
    const key = `rateLimit_${phoneNumber}`;
    this.saveState(key, rateLimitData);
  }

  loadRateLimitState(phoneNumber) {
    const key = `rateLimit_${phoneNumber}`;
    return this.loadState(key);
  }

  clearRateLimitState(phoneNumber) {
    const key = `rateLimit_${phoneNumber}`;
    this.clearState(key);
  }
}

module.exports = TemporalStateManager;
