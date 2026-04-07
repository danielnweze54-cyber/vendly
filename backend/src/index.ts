import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { paymentMiddleware } from "@x402/hono";
import { webhookCallback } from "grammy";
import { env } from "./config/env.js";
import { bot } from "./bot/telegram.js";
import { resourceServer, routeConfig } from "./x402/server.js";
import { inferenceRoutes } from "./services/inference.js";

const app = new Hono();

// --- Middleware ---
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://vendly.vercel.app"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-PAYMENT"],
  })
);

// --- Free routes (before x402 middleware) ---
app.get("/", (c) => c.json({ service: "vendly-backend", status: "ok" }));
app.get("/health", (c) =>
  c.json({ healthy: true, timestamp: new Date().toISOString() })
);
app.post("/telegram/webhook", webhookCallback(bot, "hono"));

app.get("/api/status", (c) =>
  c.json({
    agent: "vendly",
    network: `stellar:${env.STELLAR_NETWORK}`,
    publicKey: env.AGENT_STELLAR_PUBLIC,
    catalogService: env.CATALOG_SERVICE_URL,
  })
);

// --- x402 payment middleware (applies to routes in routeConfig) ---
app.use("*", paymentMiddleware(routeConfig, resourceServer));

// --- x402-protected routes ---
app.route("/api/inference", inferenceRoutes);

// --- Start server ---
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  console.log("Starting bot in long-polling mode (development)...");
  bot.start();
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`\nVendly backend running on http://localhost:${info.port}`);
  console.log(`Stellar network: stellar:${env.STELLAR_NETWORK}`);
  console.log(`Agent wallet: ${env.AGENT_STELLAR_PUBLIC}`);
  console.log(`Catalog service: ${env.CATALOG_SERVICE_URL}`);
  console.log(`\nx402-protected routes:`);
  Object.entries(routeConfig).forEach(([route, config]) => {
    console.log(`  ${route} — ${config.accepts.price}`);
  });
  if (isDev) {
    console.log("\nTelegram bot running in long-polling mode");
    console.log("Send /start to your bot to test!");
  } else {
    console.log(`\nTelegram webhook: POST /telegram/webhook`);
  }
});
