const { producer } = require('../config/kafka');

async function dispatchEmail(emailRequest) {
  await producer.connect();
  await producer.send({
    topic: 'email-dispatch-requests',
    messages: [{
      value: JSON.stringify(emailRequest),
    }],
  });
  await producer.disconnect();
}

module.exports = {
  dispatchEmail,
};
