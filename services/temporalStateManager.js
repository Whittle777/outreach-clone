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

  saveDetectionResult(transcriptionId, detectionResult) {
    const key = `detectionResult_${transcriptionId}`;
    this.saveState(key, detectionResult);
  }

  loadDetectionResult(transcriptionId) {
    const key = `detectionResult_${transcriptionId}`;
    return this.loadState(key);
  }

  clearDetectionResult(transcriptionId) {
    const key = `detectionResult_${transcriptionId}`;
    this.clearState(key);
  }

  saveIntentHandlingState(intent, result) {
    const key = `intentHandling_${intent}`;
    this.saveState(key, result);
  }

  loadIntentHandlingState(intent) {
    const key = `intentHandling_${intent}`;
    return this.loadState(key);
  }

  clearIntentHandlingState(intent) {
    const key = `intentHandling_${intent}`;
    this.clearState(key);
  }

  savePredictiveSearchState(query, result) {
    const key = `predictiveSearch_${query}`;
    this.saveState(key, result);
  }

  loadPredictiveSearchState(query) {
    const key = `predictiveSearch_${query}`;
    return this.loadState(key);
  }

  clearPredictiveSearchState(query) {
    const key = `predictiveSearch_${query}`;
    this.clearState(key);
  }

  // Confidence Score Routing state management
  saveConfidenceScoreState(callId, confidenceScore) {
    const key = `confidenceScore_${callId}`;
    this.saveState(key, confidenceScore);
  }

  loadConfidenceScoreState(callId) {
    const key = `confidenceScore_${callId}`;
    return this.loadState(key);
  }

  clearConfidenceScoreState(callId) {
    const key = `confidenceScore_${callId}`;
    this.clearState(key);
  }
}

module.exports = TemporalStateManager;
