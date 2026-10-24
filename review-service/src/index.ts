import express from "express";
import amqplib from "amqplib";

const app = express();
const PORT = 3002;
const RABBITMQ_URL = "amqp://localhost";

app.use(express.json());

const reviews = [
  { productId: 1, author: "Alex M.",   rating: 5, comment: "Incredible sound quality and the noise cancellation is top-notch." },
  { productId: 1, author: "Sarah K.",  rating: 4, comment: "Very comfortable for long sessions. Battery life is exactly as advertised." },
  { productId: 2, author: "Chris P.",  rating: 5, comment: "Most comfortable running shoes I've ever worn." },
  { productId: 2, author: "Nina W.",   rating: 4, comment: "Great grip and very lightweight." },
  { productId: 3, author: "Emma L.",   rating: 5, comment: "Absolutely stunning bag. The leather quality is exceptional." },
  { productId: 4, author: "Ryan T.",   rating: 5, comment: "The tactile feedback is perfect. My typing speed has improved." },
  { productId: 5, author: "Olivia N.", rating: 4, comment: "Stylish and the polarization really works." },
  { productId: 6, author: "Hannah G.", rating: 5, comment: "The health tracking is incredibly accurate." },
  { productId: 7, author: "Sophie R.", rating: 5, comment: "The grip is fantastic even when sweaty." },
  { productId: 8, author: "Carlos V.", rating: 4, comment: "Makes great coffee and the built-in grinder is super convenient." },
];

async function startConsumer() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue("search.reviews", { durable: false });
  channel.prefetch(1);

  channel.consume("search.reviews", (msg) => {
    if (!msg) return;

    const { query } = JSON.parse(msg.content.toString()) as { query: string };
    const q = query.toLowerCase();

    const results = reviews.filter(
      (r) =>
        r.author.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
    );

    channel.sendToQueue(
      msg.properties.replyTo,
      Buffer.from(JSON.stringify(results)),
      { correlationId: msg.properties.correlationId }
    );

    channel.ack(msg);
  });

  console.log("review-service listening on queue: search.reviews");
}

app.get("/health", (_req, res) => {
  res.json({ service: "review-service", status: "ok" });
});

app.listen(PORT, () => {
  console.log(`review-service running on http://localhost:${PORT}`);
});

startConsumer();
