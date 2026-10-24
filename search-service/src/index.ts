import express from "express";
import amqplib from "amqplib";
import { randomUUID } from "crypto";

const app = express();
const PORT = 3004;
const RABBITMQ_URL = "amqp://localhost";

app.use(express.json());

let channel: amqplib.Channel;
// correlationId → { resolve, timer }
const pendingRequests = new Map<string, { resolve: (val: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

async function connectRabbitMQ() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertQueue("search.products", { durable: false });
  await channel.assertQueue("search.reviews", { durable: false });

  // Exclusive reply queue for this service instance
  const { queue: replyQueue } = await channel.assertQueue("", { exclusive: true });

  channel.consume(replyQueue, (msg) => {
    if (!msg) return;
    const correlationId = msg.properties.correlationId as string;
    const pending = pendingRequests.get(correlationId);
    if (pending) {
      clearTimeout(pending.timer);
      pendingRequests.delete(correlationId);
      pending.resolve(JSON.parse(msg.content.toString()));
    }
  }, { noAck: true });

  console.log("search-service connected to RabbitMQ");
  return replyQueue;
}

function requestReply(queue: string, payload: unknown, replyQueue: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const correlationId = randomUUID();
    const timer = setTimeout(() => {
      pendingRequests.delete(correlationId);
      reject(new Error(`Timeout waiting for reply from ${queue}`));
    }, 5000);

    pendingRequests.set(correlationId, { resolve, timer });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      correlationId,
      replyTo: replyQueue,
    });
  });
}

async function startServer() {
  const replyQueue = await connectRabbitMQ();

  app.get("/", async (req, res) => {
    const query = (req.query.q as string) ?? "";

    try {
      const [products, reviews] = await Promise.all([
        requestReply("search.products", { query }, replyQueue),
        requestReply("search.reviews", { query }, replyQueue),
      ]);

      res.json({ query, products, reviews });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      res.status(504).json({ error: message });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ service: "search-service", status: "ok" });
  });

  app.listen(PORT, () => {
    console.log(`search-service running on http://localhost:${PORT}`);
  });
}

startServer();
