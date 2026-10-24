import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 3000;

const CORS_ORIGIN = "http://localhost:5173";

function corsHeaders(proxyRes: any) {
  proxyRes.headers["access-control-allow-origin"] = CORS_ORIGIN;
  proxyRes.headers["access-control-allow-headers"] = "content-type";
}

app.use(cors({ origin: CORS_ORIGIN }));


app.use("/api/reviews", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { "^/": "/reviews/", },
  on: { proxyRes: corsHeaders },
}));

app.use("/api/products", createProxyMiddleware({
  target: "http://localhost:3003",
  changeOrigin: true,
  pathRewrite: { "^/api/products": "/products" },
  on: { proxyRes: corsHeaders },
}));

app.use("/api/search", createProxyMiddleware({
  target: "http://localhost:3004",
  changeOrigin: true,
  pathRewrite: { "^/api/search": "" },
  on: { proxyRes: corsHeaders },
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "api-gateway", status: "ok" });
});

app.listen(PORT, () => {
  console.log(`api-gateway running on http://localhost:${PORT}`);
  console.log(`  /api/products → products-service :3003`);
  console.log(`  /api/reviews  → review-service   :3002`);
  console.log(`  /api/search   → search-service   :3004`);
});
