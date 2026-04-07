import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { x402ResourceServer, paymentMiddleware } from "@x402/hono";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { env } from "./config/env.js";
import { products } from "./products.js";

const app = new Hono();

// --- Middleware ---
app.use("*", logger());
app.use("*", cors());

// --- x402 payment protection ---
const resourceServer = new x402ResourceServer();
resourceServer.register(`stellar:${env.STELLAR_NETWORK}`, new ExactStellarScheme());

const routeConfig = {
  "GET /api/products": {
    accepts: {
      scheme: "exact",
      price: "$0.001",
      network: `stellar:${env.STELLAR_NETWORK}`,
      payTo: env.CATALOG_STELLAR_PUBLIC,
    },
  },
  "GET /api/products/:id": {
    accepts: {
      scheme: "exact",
      price: "$0.001",
      network: `stellar:${env.STELLAR_NETWORK}`,
      payTo: env.CATALOG_STELLAR_PUBLIC,
    },
  },
} as const;

// --- Health check (before x402 — free) ---
app.get("/", (c) =>
  c.json({ service: "vendly-catalog-service", status: "ok" })
);
app.get("/health", (c) =>
  c.json({ healthy: true, timestamp: new Date().toISOString() })
);

// --- x402 middleware (only applies to routes in routeConfig) ---
app.use("*", paymentMiddleware(routeConfig, resourceServer));

// --- Product routes (x402 protected) ---
app.route("/api/products", products);

// --- Start server ---
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`\nVendly Catalog Service running on http://localhost:${info.port}`);
  console.log(`Stellar network: stellar:${env.STELLAR_NETWORK}`);
  console.log(`Receiving payments at: ${env.CATALOG_STELLAR_PUBLIC}`);
  console.log(`\nProtected routes:`);
  console.log(`  GET /api/products      — $0.001 per request`);
  console.log(`  GET /api/products/:id  — $0.001 per request`);
});
