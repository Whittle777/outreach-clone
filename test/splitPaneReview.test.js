const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app'); // Adjust the path as necessary

chai.use(chaiHttp);
const expect = chai.expect;

describe('Split-Pane Review Interface', () => {
  it('should get the review queue', (done) => {
    chai.request(server)
      .get('/api/split-pane/review-queue')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should get the contextual record', (done) => {
    const recordId = '12345'; // Replace with a valid record ID
    chai.request(server)
      .get(`/api/split-pane/contextual-record/${recordId}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        done();
      });
  });

  it('should get the agentic action panel', (done) => {
    const recordId = '12345'; // Replace with a valid record ID
    chai.request(server)
      .get(`/api/split-pane/agentic-action-panel/${recordId}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        done();
      });
  });
});
