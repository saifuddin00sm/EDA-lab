import express from "express";
import amqplib from "amqplib";

const app = express();
const PORT = 3002;
const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE = "catalog";

app.use(express.json());

type Review = { id: number; productId: number; author: string; rating: number; comment: string; date: string };

const reviews: Review[] = [
  { id: 1,  productId: 1, author: "Alex M.",   rating: 5, comment: "Incredible sound quality and the noise cancellation is top-notch.", date: "2024-11-10" },
  { id: 2,  productId: 1, author: "Sarah K.",  rating: 4, comment: "Very comfortable for long sessions. Battery life is exactly as advertised.", date: "2024-10-22" },
  { id: 3,  productId: 2, author: "Chris P.",  rating: 5, comment: "Most comfortable running shoes I've ever worn.", date: "2024-11-05" },
  { id: 4,  productId: 2, author: "Nina W.",   rating: 4, comment: "Great grip and very lightweight.", date: "2024-10-18" },
  { id: 5,  productId: 3, author: "Emma L.",   rating: 5, comment: "Absolutely stunning bag. The leather quality is exceptional.", date: "2024-11-12" },
  { id: 6,  productId: 4, author: "Ryan T.",   rating: 5, comment: "The tactile feedback is perfect. My typing speed has improved.", date: "2024-11-08" },
  { id: 7,  productId: 5, author: "Olivia N.", rating: 4, comment: "Stylish and the polarization really works.", date: "2024-11-01" },
  { id: 8,  productId: 6, author: "Hannah G.", rating: 5, comment: "The health tracking is incredibly accurate.", date: "2024-11-15" },
  { id: 9,  productId: 7, author: "Sophie R.", rating: 5, comment: "The grip is fantastic even when sweaty.", date: "2024-11-03" },
  { id: 10, productId: 8, author: "Carlos V.", rating: 4, comment: "Makes great coffee and the built-in grinder is super convenient.", date: "2024-11-07" },
];

let channel: amqplib.Channel;

function publish(review: Review) {
  channel.publish(EXCHANGE, "review.updated", Buffer.from(JSON.stringify(review)), { persistent: true });
  console.log(`review.updated published → id:${review.id}`);
}

function publishAll() {
  reviews.forEach(publish);
  console.log(`review-service published ${reviews.length} reviews`);
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.get("/reviews", (req, res) => {
  const productId = req.query.productId ? Number(req.query.productId) : null;
  const result = productId ? reviews.filter((r) => r.productId === productId) : reviews;
  res.json(result);
});

app.post("/reviews", (req, res) => {
  const review: Review = { ...req.body, id: Date.now() };
  reviews.push(review);
  publish(review);
  res.status(201).json(review);
});

app.get("/health", (_req, res) => {
  res.json({ service: "review-service", status: "ok" });
});

// ── RabbitMQ ─────────────────────────────────────────────────────────────────

async function start() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  const { queue } = await channel.assertQueue("review-service.sync", { durable: true });
  await channel.bindQueue(queue, EXCHANGE, "catalog.sync");

  channel.consume(queue, (msg) => {
    if (!msg) return;
    publishAll();
    channel.ack(msg);
  });

  console.log("review-service listening for catalog.sync");

  app.listen(PORT, () => {
    console.log(`review-service running on http://localhost:${PORT}`);
  });
}

start();
