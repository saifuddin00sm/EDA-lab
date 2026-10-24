import express from "express";
import amqplib from "amqplib";

const app = express();
const PORT = 3004;
const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE = "catalog";

app.use(express.json());

// ── Materialized store ──────────────────────────────────────────────────────
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  rating: number;
  image: string;
};
type Review = {
  id: number;
  productId: number;
  author: string;
  rating: number;
  comment: string;
};
type MaterializedProduct = Product & { reviews: Review[] };

const store = new Map<number, MaterializedProduct>();

function upsertProduct(product: Product) {
  const existing = store.get(product.id);
  store.set(product.id, { ...product, reviews: existing?.reviews ?? [] });
}

function upsertReview(review: Review) {
  const product = store.get(review.productId);
  if (!product) return;
  const reviews = product.reviews.filter((r) => r.id !== review.id);
  store.set(review.productId, { ...product, reviews: [...reviews, review] });
}
// ───────────────────────────────────────────────────────────────────────────

async function start() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  // Assert queue and bindings BEFORE requesting sync
  const { queue } = await channel.assertQueue("search-service.catalog", {
    durable: true,
  });
  await channel.bindQueue(queue, EXCHANGE, "product.updated");
  await channel.bindQueue(queue, EXCHANGE, "review.updated");

  channel.consume(queue, (msg) => {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const payload = JSON.parse(msg.content.toString());
    if (routingKey === "product.updated") upsertProduct(payload as Product);
    if (routingKey === "review.updated") upsertReview(payload as Review);
    channel.ack(msg);
  });

  // Request full sync — products and review services will publish all their data
  channel.publish(EXCHANGE, "catalog.sync", Buffer.from("{}"), {
    persistent: false,
  });
  console.log(
    "search-service requested catalog.sync, building materialized store...",
  );

  // ── HTTP ──────────────────────────────────────────────────────────────────
  app.get("/", (req, res) => {
    const query = ((req.query.q as string) ?? "").toLowerCase();

    const results = [...store.values()].filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );

    res.json({ query, total: results.length, products: results });
  });

  app.post("/", (req, res) => {


    const productId = Number(req.body.productId) ;

    const result = [...store.values()].find((p) => p.id === productId);

    res.json({ product: result });
  });

  app.get("/health", (_req, res) => {
    res.json({ service: "search-service", status: "ok", indexed: store.size });
  });

  app.listen(PORT, () => {
    console.log(`search-service running on http://localhost:${PORT}`);
  });
}

start();
