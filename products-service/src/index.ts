import express from "express";
import amqplib from "amqplib";

const app = express();
const PORT = 3003;
const RABBITMQ_URL = "amqp://localhost";

app.use(express.json());

const products = [
  { id: 1, name: "Wireless Headphones", price: 79.99,  category: "Electronics"  },
  { id: 2, name: "Running Sneakers",    price: 119.99, category: "Footwear"      },
  { id: 3, name: "Leather Backpack",    price: 89.99,  category: "Bags"          },
  { id: 4, name: "Mechanical Keyboard", price: 149.99, category: "Electronics"   },
  { id: 5, name: "Sunglasses",          price: 59.99,  category: "Accessories"   },
  { id: 6, name: "Smart Watch",         price: 199.99, category: "Electronics"   },
  { id: 7, name: "Yoga Mat",            price: 39.99,  category: "Sports"        },
  { id: 8, name: "Coffee Maker",        price: 69.99,  category: "Kitchen"       },
];

async function startConsumer() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue("search.products", { durable: false });
  channel.prefetch(1);

  channel.consume("search.products", (msg) => {
    if (!msg) return;

    const { query } = JSON.parse(msg.content.toString()) as { query: string };
    const q = query.toLowerCase();

    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );

    channel.sendToQueue(
      msg.properties.replyTo,
      Buffer.from(JSON.stringify(results)),
      { correlationId: msg.properties.correlationId }
    );

    channel.ack(msg);
  });

  console.log("products-service listening on queue: search.products");
}

app.get("/health", (_req, res) => {
  res.json({ service: "products-service", status: "ok" });
});

app.listen(PORT, () => {
  console.log(`products-service running on http://localhost:${PORT}`);
});

startConsumer();
