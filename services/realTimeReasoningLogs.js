const logger = require('../services/logger');

class RealTimeReasoningLogs {
  constructor() {
    this.logs = [];
  }

  addLog(step, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      step,
      message,
    };
    this.logs.push(logEntry);
    logger.log(JSON.stringify(logEntry));
  }

  getLogs() {
    return this.logs;
  }
}

module.exports = new RealTimeReasoningLogs();
