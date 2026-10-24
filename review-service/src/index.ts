import express from "express";
import amqplib from "amqplib";

const app = express();
const PORT = 3002;
const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE = "catalog";

const reviews = [
  { id: 1,  productId: 1, author: "Alex M.",   rating: 5, comment: "Incredible sound quality and the noise cancellation is top-notch." },
  { id: 2,  productId: 1, author: "Sarah K.",  rating: 4, comment: "Very comfortable for long sessions. Battery life is exactly as advertised." },
  { id: 3,  productId: 2, author: "Chris P.",  rating: 5, comment: "Most comfortable running shoes I've ever worn." },
  { id: 4,  productId: 2, author: "Nina W.",   rating: 4, comment: "Great grip and very lightweight." },
  { id: 5,  productId: 3, author: "Emma L.",   rating: 5, comment: "Absolutely stunning bag. The leather quality is exceptional." },
  { id: 6,  productId: 4, author: "Ryan T.",   rating: 5, comment: "The tactile feedback is perfect. My typing speed has improved." },
  { id: 7,  productId: 5, author: "Olivia N.", rating: 4, comment: "Stylish and the polarization really works." },
  { id: 8,  productId: 6, author: "Hannah G.", rating: 5, comment: "The health tracking is incredibly accurate." },
  { id: 9,  productId: 7, author: "Sophie R.", rating: 5, comment: "The grip is fantastic even when sweaty." },
  { id: 10, productId: 8, author: "Carlos V.", rating: 4, comment: "Makes great coffee and the built-in grinder is super convenient." },
];

function publishAll(channel: amqplib.Channel) {
  for (const review of reviews) {
    channel.publish(
      EXCHANGE,
      "review.updated",
      Buffer.from(JSON.stringify(review)),
      { persistent: true }
    );
  }
  console.log(`review-service published ${reviews.length} reviews`);
}

async function start() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  // Listen for sync requests from search-service
  const { queue } = await channel.assertQueue("review-service.sync", { durable: true });
  await channel.bindQueue(queue, EXCHANGE, "catalog.sync");

  channel.consume(queue, (msg) => {
    if (!msg) return;
    publishAll(channel);
    channel.ack(msg);
  });

  console.log("review-service listening for catalog.sync");

  app.get("/health", (_req, res) => {
    res.json({ service: "review-service", status: "ok" });
  });

  app.listen(PORT, () => {
    console.log(`review-service running on http://localhost:${PORT}`);
  });
}

start();
