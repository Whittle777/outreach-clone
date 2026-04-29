const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Assuming the main app file is named app.js
const config = require("../config/index").getConfig();
const session = require('express-session');

chai.use(chaiHttp);
const { expect } = chai;

describe('Call Rate Limiting Middleware', () => {
  let server;

  before(() => {
    server = app.listen(3000);
  });

  after(() => {
    server.close();
  });

  beforeEach(() => {
    // Reset session data for each test
    session.sessions = {};
  });

  it('should allow a call if within rate limit', (done) => {
    const phoneNumber = '1234567890';
    const callType = 'voice';
    const limit = 5;
    const duration = 60; // 60 seconds

    config.rateLimits = {
      [callType]: {
        [phoneNumber]: {
          limit,
          duration,
        },
      },
    };

    chai.request(app)
      .post('/call')
      .send({ phoneNumber, callType })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Call allowed');
        done();
      });
  });

  it('should block a call if rate limit exceeded', (done) => {
    const phoneNumber = '1234567890';
    const callType = 'voice';
    const limit = 1;
    const duration = 60; // 60 seconds

    config.rateLimits = {
      [callType]: {
        [phoneNumber]: {
          limit,
          duration,
        },
      },
    };

    // Simulate multiple calls within the same window
    for (let i = 0; i < limit; i++) {
      chai.request(app)
        .post('/call')
        .send({ phoneNumber, callType })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Call allowed');
        });
    }

    // The next call should be blocked
    chai.request(app)
      .post('/call')
      .send({ phoneNumber, callType })
      .end((err, res) => {
        expect(res).to.have.status(429);
        expect(res.body).to.have.property('error', 'Rate limit exceeded');
        done();
      });
  });

  it('should return 400 if phone number not allowed for call type', (done) => {
    const phoneNumber = '1234567890';
    const callType = 'voice';

    config.rateLimits = {};

    chai.request(app)
      .post('/call')
      .send({ phoneNumber, callType })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error', 'Phone number not allowed for this call type');
        done();
      });
  });
});
