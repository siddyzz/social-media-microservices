import amqp from "amqplib";
import { info, warn, error } from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    info("Connected to rabbit mq");
    return channel;
  } catch (e) {
    error("Error connecting to rabbit mq", e);
  }
}

async function publishToRabbitMQ(routingKey, message) {
  if (!channel) {
    warn("RabbitMQ channel is not established. Attempting to reconnect...");
    await connectToRabbitMQ();
  }
  await channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message)),
  );
  info(`Message published to RabbitMQ with routing key: ${routingKey}`);
}

export { connectToRabbitMQ, channel, EXCHANGE_NAME, publishToRabbitMQ };
