import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 3000;

app.use(express.json());

// All search requests are forwarded to search-service
app.use(
  "/api/search",
  createProxyMiddleware({
    target: "http://localhost:3004",
    changeOrigin: true,
    rewrite: (path) => path.replace("/api/search", ""),
  })
);

app.get("/health", (_req, res) => {
  res.json({ service: "api-gateway", status: "ok" });
});

app.listen(PORT, () => {
  console.log(`api-gateway running on http://localhost:${PORT}`);
  console.log(`  /api/search → search-service http://localhost:3004`);
});
