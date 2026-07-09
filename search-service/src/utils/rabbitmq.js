import amqp from "amqplib";
import { info, warn, error } from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";
async function connectToRabbitMQ() {
  if (connection && channel) {
    info("Already connected to RabbitMQ");
    return channel;
  }
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    connection.on("error", (err) => {
      error("RabbitMQ Connection Error", err);
    });
    connection.on("close", () => {
      warn("RabbitMQ Connection Closed");
    });

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

    info("Connected to rabbit mq");
    return channel;
  } catch (e) {
    error("Error connecting to rabbit mq", e);
  }
}

async function consumeFromRabbitMQ(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, async (msg) => {
    if (msg !== null) {
      try {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        channel.ack(msg);
      } catch (err) {
        error("Error processing RabbitMQ message", err);
        channel.nack(msg, false, false);
      }
    }
  });

  info(`Subscribed to event: ${routingKey}`);
}
export { connectToRabbitMQ, consumeFromRabbitMQ, channel, EXCHANGE_NAME };
