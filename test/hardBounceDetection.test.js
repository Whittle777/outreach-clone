const { expect } = require('chai');
const sinon = require('sinon');
const emailService = require('../services/emailService');
const Prospect = require('../models/Prospect');
const BounceEvent = require('../models/bounceEvent');

describe('Hard Bounce Detection', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should mark prospect as failed and create a bounce event on hard bounce', async () => {
    const prospectEmail = 'test@example.com';
    const prospectBento = 'bento123';

    sandbox.stub(Prospect, 'markProspectAsFailed').resolves();
    sandbox.stub(BounceEvent, 'create').resolves();

    await emailService.handleHardBounce(prospectEmail, prospectBento);

    expect(Prospect.markProspectAsFailed.calledOnceWith(prospectEmail, prospectBento)).to.be.true;
    expect(BounceEvent.create.calledOnceWith({ email: prospectEmail, bento: prospectBento, timestamp: sinon.match.date })).to.be.true;
  });
});
