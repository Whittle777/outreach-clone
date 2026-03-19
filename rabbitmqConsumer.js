const amqplib = require('amqplib');

async function startConsumer(config) {
  try {
    const connection = await amqplib.connect(config.url);
    const channel = await connection.createChannel();

    const queue = config.queue;
    await channel.assertQueue(queue, { durable: true });

    console.log(` [*] Waiting for messages in %s. To exit press CTRL+C`, queue);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const message = JSON.parse(msg.content.toString());
        console.log(' [x] Received %s', message);

        // Process the message
        await processMessage(message);

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
