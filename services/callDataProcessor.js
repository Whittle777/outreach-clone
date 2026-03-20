const logger = require('../services/logger');

class CallDataProcessor {
  constructor() {
    this.callData = [];
  }

  async fetchCallData() {
    // Simulate fetching call data from a database or API
    const newCallData = [
      { id: 1, status: 'Connected', duration: 120 },
      { id: 2, status: 'Voicemail', duration: 60 },
      { id: 3, status: 'Disconnected', duration: 0 },
    ];

    // Log the fetched call data
    logger.log('Call data fetched', newCallData);

    // Process the call data
    this.processCallData(newCallData);

    return newCallData;
  }

  processCallData(callData) {
    callData.forEach((call) => {
      logger.log('Processing call', call);

      // Example processing: log call status and duration
      if (call.status === 'Connected') {
        logger.log('Call connected', { callId: call.id, duration: call.duration });
      } else if (call.status === 'Voicemail') {
        logger.log('Voicemail left', { callId: call.id, duration: call.duration });
      } else if (call.status === 'Disconnected') {
        logger.log('Call disconnected', { callId: call.id, duration: call.duration });
      }
    });

    // Store the processed call data
    this.callData = callData;
  }

  getCallData() {
    return this.callData;
  }
}

module.exports = new CallDataProcessor();
