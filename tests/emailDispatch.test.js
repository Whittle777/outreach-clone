const { run, simulateHighLoad } = require('../services/emailDispatch');
const nodemailer = require('nodemailer');
const sinon = require('sinon');
const { expect } = require('chai');

describe('Email Dispatch High Load Simulation', () => {
  let transporter;
  let sendMailStub;

  beforeAll(async () => {
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    });

    sendMailStub = sinon.stub(transporter, 'sendMail').resolves({ accepted: ['prospect@example.com'] });

    await run();
  });

  afterAll(() => {
    sendMailStub.restore();
  });

  it('should handle high load scenarios', async () => {
    const numMessages = 10;
    await simulateHighLoad(numMessages);

    expect(sendMailStub.callCount).to.equal(numMessages);
    for (let i = 0; i < numMessages; i++) {
      const email = `prospect-${i}@example.com`;
      expect(sendMailStub.getCall(i).args[0].to).to.equal(email);
    }
  });
});
