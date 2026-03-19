const amqplib = require('amqplib');

async function startConsumer() {
  try {
    const connection = await amqplib.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'email-dispatch-requests';
    await channel.assertQueue(queue, { durable: true });

    console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const emailRequest = JSON.parse(msg.content.toString());
        console.log(' [x] Received %s', emailRequest);

        // Process the message
        await processMessage(emailRequest);

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Error starting RabbitMQ consumer:', error);
  }
}

module.exports = {
  startConsumer,
};
