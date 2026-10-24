import express from "express";
import amqplib from "amqplib";

const app = express();
const PORT = 3003;
const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE = "catalog";

const products = [
  { id: 1, name: "Wireless Headphones", price: 79.99,  category: "Electronics", rating: 4.5, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop" },
  { id: 2, name: "Running Sneakers",    price: 119.99, category: "Footwear",     rating: 4.3, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop" },
  { id: 3, name: "Leather Backpack",    price: 89.99,  category: "Bags",         rating: 4.7, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop" },
  { id: 4, name: "Mechanical Keyboard", price: 149.99, category: "Electronics",  rating: 4.6, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop" },
  { id: 5, name: "Sunglasses",          price: 59.99,  category: "Accessories",  rating: 4.2, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop" },
  { id: 6, name: "Smart Watch",         price: 199.99, category: "Electronics",  rating: 4.8, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop" },
  { id: 7, name: "Yoga Mat",            price: 39.99,  category: "Sports",       rating: 4.4, image: "https://images.unsplash.com/photo-1601925228008-f5e4c5e5b8e4?w=400&h=300&fit=crop" },
  { id: 8, name: "Coffee Maker",        price: 69.99,  category: "Kitchen",      rating: 4.1, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop" },
];

function publishAll(channel: amqplib.Channel) {
  for (const product of products) {
    channel.publish(
      EXCHANGE,
      "product.updated",
      Buffer.from(JSON.stringify(product)),
      { persistent: true }
    );
  }
  console.log(`products-service published ${products.length} products`);
}

async function start() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  // Listen for sync requests from search-service
  const { queue } = await channel.assertQueue("products-service.sync", { durable: true });
  await channel.bindQueue(queue, EXCHANGE, "catalog.sync");

  channel.consume(queue, (msg) => {
    if (!msg) return;
    publishAll(channel);
    channel.ack(msg);
  });

  console.log("products-service listening for catalog.sync");

  app.get("/health", (_req, res) => {
    res.json({ service: "products-service", status: "ok" });
  });

  app.listen(PORT, () => {
    console.log(`products-service running on http://localhost:${PORT}`);
  });
}

start();
