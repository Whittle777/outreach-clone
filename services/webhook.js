const prospectService = require('../models/Prospect');

async function handleWebhookPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid webhook payload');
  }

  const { prospectId, bento, ...prospectData } = payload;

  if (!prospectId || typeof prospectId !== 'string') {
    throw new Error('Invalid prospectId in webhook payload');
  }

  if (!bento || typeof bento !== 'string') {
    throw new Error('Invalid bento in webhook payload');
  }

  await prospectService.updateProspect(prospectId, prospectData, bento);
}

module.exports = {
  handleWebhookPayload,
};
