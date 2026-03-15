const dns = require('dns');

async function validateEmailBatch(messages) {
  // Implement your batch validation logic here
  // For example, check if each email in the batch has a valid format, recipient, etc.
  // Return an array of booleans indicating the validity of each message
  return messages.map(() => true);
}

async function validateWebhookPayload(payload) {
  // Implement your webhook payload validation logic here
  // For example, check if the payload contains required fields and valid data
  // Return true if valid, false otherwise
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  if (!payload.prospectId || typeof payload.prospectId !== 'string') {
    return false;
  }
  if (!payload.bento || typeof payload.bento !== 'number') {
    return false;
  }
  if (!payload.newStatus || typeof payload.newStatus !== 'string') {
    return false;
  }
  // Additional validation logic for newStatus
  const validStatuses = ['Uncontacted', 'Bounced', 'Replied'];
  if (!validStatuses.includes(payload.newStatus)) {
    return false;
  }
  return true;
}

async function validateSPFRecord(domain) {
  return new Promise((resolve, reject) => {
    dns.resolveTxt(domain, (err, records) => {
      if (err) {
        reject(err);
      }
      const spfRecords = records.filter(record => record[0].includes('v=spf1'));
      if (spfRecords.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

module.exports = {
  validateEmailBatch,
  validateWebhookPayload,
  validateSPFRecord,
};
