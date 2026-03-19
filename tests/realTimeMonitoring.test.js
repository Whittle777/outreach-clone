const assert = require('assert');
const sinon = require('sinon');
const { VoiceAgentCall } = require('../models/VoiceAgentCall');
const { logger } = require('../services/logger');

describe('Real-time Monitoring Feature', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should log a call status change', async function() {
    const prospectId = '123';
    const callStatus = 'Connected';
    const preGeneratedScript = 'Follow up on the recent interaction';
    const ttsAudioFileUrl = 'http://example.com/audio.mp3';
    const callTranscript = 'Hello, this is a test call.';

    sandbox.stub(VoiceAgentCall, 'detectResistanceOrRegulatoryEdgeCase').resolves(false);
    sandbox.stub(logger, 'log');

    await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);

    sinon.assert.calledWith(logger.log, `Call status changed to ${callStatus} for prospect ${prospectId}`);
  });

  it('should detect resistance or regulatory edge cases', async function() {
    const prospectId = '123';
    const callStatus = 'Connected';
    const preGeneratedScript = 'Follow up on the recent interaction';
    const ttsAudioFileUrl = 'http://example.com/audio.mp3';
    const callTranscript = 'Hello, this is a test call.';

    sandbox.stub(VoiceAgentCall, 'detectResistanceOrRegulatoryEdgeCase').resolves(true);
    sandbox.stub(logger, 'error');

    await VoiceAgentCall.create(prospectId, callStatus, preGeneratedScript, ttsAudioFileUrl, callTranscript);

    sinon.assert.calledWith(logger.error, `Resistance or regulatory edge case detected for prospect ${prospectId}`);
  });
});
