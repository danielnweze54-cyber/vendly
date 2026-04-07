# Vendly Developer Resources

Comprehensive reference compiled from researching all technologies in the Vendly stack. Use this as a quick-reference while building — every code snippet uses the **actual API** (not pseudocode).

---

## Table of Contents

1. [x402 Protocol & SDK](#1-x402-protocol--sdk)
2. [Stellar & USDC](#2-stellar--usdc)
3. [grammY (Telegram Bot)](#3-grammy-telegram-bot)
4. [Hono (Backend Framework)](#4-hono-backend-framework)
5. [Anthropic Claude API](#5-anthropic-claude-api)
6. [Supabase (Database + Realtime)](#6-supabase-database--realtime)
7. [Telegram Bot API](#7-telegram-bot-api)
8. [Deployment (Railway + Vercel)](#8-deployment-railway--vercel)

---

## 1. x402 Protocol & SDK

### 1.1 How x402 Works

x402 repurposes HTTP status code 402 ("Payment Required") for machine-to-machine payments:

```
Client                          Server                        Facilitator
  │                               │                               │
  │  GET /api/catalog             │                               │
  ├──────────────────────────────>│                               │
  │  402 Payment Required         │                               │
  │  (price, payTo, network)      │                               │
  │<──────────────────────────────│                               │
  │                               │                               │
  │  Sign payment auth entry      │                               │
  │  (client-side, Soroban auth)  │                               │
  │                               │                               │
  │  GET /api/catalog             │                               │
  │  X-PAYMENT: <signed-payload>  │                               │
  ├──────────────────────────────>│                               │
  │                               │  Verify + settle payment      │
  │                               ├──────────────────────────────>│
  │                               │  Payment confirmed            │
  │                               │<──────────────────────────────│
  │  200 OK + data                │                               │
  │<──────────────────────────────│                               │
```

The `@x402/fetch` wrapper handles this entire flow automatically — you just call `fetchWithPayment(url)`.

### 1.2 NPM Packages

All packages are scoped `@x402/*` v2.x. **Do NOT use** the legacy `x402-express`/`x402-fetch` (v1.x) — they don't support Stellar.

```bash
# Server-side (protecting endpoints)
npm i @x402/core @x402/hono @x402/stellar

# Client-side (paying for endpoints)
npm i @x402/core @x402/fetch @x402/stellar
```

### 1.3 Server-Side: Protecting Endpoints

```typescript
import { Hono } from "hono";
import { x402ResourceServer, paymentMiddleware } from "@x402/hono";
import { ExactStellarScheme } from "@x402/stellar/exact/server";

const app = new Hono();

// 1. Create resource server + register Stellar scheme (no signer needed server-side)
//    The facilitator is auto-configured (public x402 facilitator at x402.org)
const resourceServer = new x402ResourceServer();
resourceServer.register("stellar:testnet", new ExactStellarScheme());

// 2. Define route pricing — `accepts` wrapper is REQUIRED
const routeConfig = {
  "GET /api/catalog": {
    accepts: {
      scheme: "exact",
      price: "$0.001",               // Dollar-prefixed string — SDK converts to 7-decimal Stellar USDC
      network: "stellar:testnet",
      payTo: "GXXXXXXXXXXXXXXX",     // Your Stellar public key
    },
  },
} as const;

// 3. Health/free routes BEFORE the x402 middleware
app.get("/health", (c) => c.json({ ok: true }));

// 4. Apply middleware — NOTE: routes first, then server
app.use("*", paymentMiddleware(routeConfig, resourceServer));

// 5. Define your route as normal
app.get("/api/catalog", (c) => {
  return c.json({ products: [] });
});
```

**Key points:**
- `x402ResourceServer` and `paymentMiddleware` both come from `@x402/hono` (NOT `@x402/core`)
- `paymentMiddleware(routes, server)` — routes config is the **first** argument, server is **second**
- Free/health routes must be registered **before** the x402 middleware
- `HTTPFacilitatorClient` is NOT needed — the resource server auto-discovers the public facilitator

### 1.4 Client-Side: Paying for Endpoints

```typescript
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

// 1. Create a signer from the agent's Stellar secret key
const signer = createEd25519Signer(
  "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // Agent's Stellar secret key
  "stellar:testnet"
);

// 2. Create client + register Stellar scheme with signer + RPC
const client = new x402Client()
  .register("stellar:*", new ExactStellarScheme(signer, {
    url: "https://soroban-testnet.stellar.org",  // Soroban RPC URL
  }));

// 3. Wrap native fetch — this handles 402 → sign → retry automatically
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// 4. Use it like normal fetch — payment is transparent
const response = await fetchWithPayment("https://example.com/api/catalog");
const data = await response.json();
```

### 1.5 Import Path Cheat Sheet

| Import | From | When |
|---|---|---|
| `ExactStellarScheme` | `@x402/stellar/exact/server` | Server protecting endpoints (no signer) |
| `ExactStellarScheme` | `@x402/stellar/exact/client` | Client paying for endpoints (needs signer + RPC) |
| `createEd25519Signer` | `@x402/stellar` | Creating client signer from secret key |
| `x402ResourceServer` | `@x402/hono` | Server-side resource server (**NOT** from `@x402/core`) |
| `paymentMiddleware` | `@x402/hono` | Hono middleware for paywalled routes |
| `x402Client` | `@x402/fetch` | Client-side payment client |
| `wrapFetchWithPayment` | `@x402/fetch` | Wrapping fetch with auto-payment |

### 1.6 Critical Gotchas

- **Same class name, different implementation**: `ExactStellarScheme` exists in both `exact/server` and `exact/client`. Don't mix them up.
- **`x402ResourceServer` comes from `@x402/hono`**: NOT from `@x402/core`. The core package only exports `x402Version`.
- **`paymentMiddleware(routes, server)`**: Routes config is the **first** argument, resource server is **second**. Easy to swap by mistake.
- **No manual facilitator setup**: `HTTPFacilitatorClient` is NOT a public export. The resource server auto-discovers the public facilitator.
- **The facilitator sponsors all gas fees**: The client never needs XLM for transaction fees. The facilitator wraps signed auth entries into a full Soroban transaction and submits it.
- **Client signs auth entries, not full transactions**: `createEd25519Signer` produces a signer for Soroban authorization entries only.
- **Dollar strings in route config**: Use `"$0.001"` format — the SDK handles conversion to 7-decimal Stellar USDC internally.
- **`accepts` wrapper is required**: Route config must use `{ accepts: { scheme, price, network, payTo } }`. Omitting `accepts` causes a type error.
- **Network identifiers are CAIP-2**: `"stellar:testnet"`, `"stellar:pubnet"`. Client wildcard: `"stellar:*"`.
- **Free routes go before x402 middleware**: Health checks, webhook endpoints, etc. must be registered before `app.use("*", paymentMiddleware(...))`.

---

## 2. Stellar & USDC

### 2.1 Account Setup (Testnet)

```bash
# Step 1: Generate keypair in Stellar Laboratory
# https://laboratory.stellar.org/ → "Create Account" section

# Step 2: Fund with XLM via Friendbot (activates the account)
curl "https://friendbot.stellar.org?addr=GXXXXXXXXXXXXXXX"

# Step 3: Fund with USDC via Circle Faucet
# https://faucet.circle.com/ → Select "Stellar" network → Paste public key
```

**Important**: Friendbot gives XLM (needed for account activation). Circle Faucet gives USDC (needed for x402 payments). You need BOTH.

### 2.2 USDC on Stellar

- **Issuer**: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` (Circle)
- **Decimals**: 7 (not 6 like EVM). `$1.00` = `10000000` raw units.
- **Transfer mechanism**: Soroban SAC (Stellar Asset Contract) using SEP-41 `transfer(from, to, amount)`
- **Contract address (testnet)**: Derived from the native USDC asset — x402 SDK handles this automatically

### 2.3 Querying Balance (Horizon API)

```typescript
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

async function getUsdcBalance(publicKey: string): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const usdc = account.balances.find(
    (b) =>
      b.asset_type === "credit_alphanum4" &&
      b.asset_code === "USDC" &&
      b.asset_issuer === "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
  );
  return usdc?.balance ?? "0";
}
```

### 2.4 Horizon REST API (for frontend without SDK)

```bash
# Get account balances
GET https://horizon-testnet.stellar.org/accounts/GXXXXXXX

# Response includes balances array:
# { "balances": [{ "asset_code": "USDC", "balance": "10.0000000", ... }] }
```

For the dashboard, you can call this directly from Next.js without the full Stellar SDK.

---

## 3. grammY (Telegram Bot)

### 3.1 Basic Bot Setup

```typescript
import { Bot, Context } from "grammy";

const bot = new Bot("YOUR_BOT_TOKEN");

// Command handlers
bot.command("start", (ctx) =>
  ctx.reply("Hola! Soy el asistente de ventas. ¿En qué puedo ayudarte?")
);

bot.command("help", (ctx) =>
  ctx.reply("Puedes preguntarme sobre productos, precios y disponibilidad.")
);

// Message handler (catch-all for text messages)
bot.on("message:text", async (ctx) => {
  const userMessage = ctx.message.text;
  const chatId = ctx.chat.id;
  // Process with Claude, then reply
  const response = await getAgentResponse(userMessage, chatId);
  await ctx.reply(response);
});

// Development: long polling
bot.start();
```

### 3.2 Inline Keyboards (Product Selection)

```typescript
import { InlineKeyboard } from "grammy";

// Create keyboard with product options
const keyboard = new InlineKeyboard()
  .text("Nike Air Max - $89.99", "product_1")
  .row()
  .text("Adidas Ultra - $79.99", "product_2")
  .row()
  .text("Ver más productos", "more_products");

await ctx.reply("Tenemos estas opciones:", {
  reply_markup: keyboard,
});

// Handle button callbacks
bot.callbackQuery(/^product_/, async (ctx) => {
  const productId = ctx.callbackQuery.data;  // "product_1", "product_2", etc.
  await ctx.answerCallbackQuery();            // Acknowledge the button press
  await ctx.reply(`Has seleccionado: ${productId}`);
});
```

### 3.3 Webhook Mode (Production with Hono)

```typescript
import { webhookCallback } from "grammy";
import { Hono } from "hono";

const app = new Hono();
const bot = new Bot("YOUR_BOT_TOKEN");

// Register handlers on bot...
bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));

// Mount webhook
app.post("/telegram/webhook", webhookCallback(bot, "hono"));

// Set webhook URL (run once after deploying)
// await bot.api.setWebhook("https://your-backend.up.railway.app/telegram/webhook");
```

### 3.4 Key grammY Patterns

- **`ctx.chat.id`**: Unique identifier for the conversation (use as conversation key)
- **`ctx.from.first_name`**: User's first name (for personalization)
- **`ctx.reply(text)`**: Send a text reply
- **`ctx.reply(text, { parse_mode: "HTML" })`**: Send formatted reply (`<b>bold</b>`, `<i>italic</i>`)
- **`ctx.replyWithPhoto(url)`**: Send an image
- **`bot.api.setWebhook(url)`**: Set webhook URL for production
- **Error handling**: `bot.catch((err) => console.error("Bot error:", err))`

### 3.5 Development vs Production

| Mode | Method | When |
|---|---|---|
| Long polling | `bot.start()` | Local development — no public URL needed |
| Webhook | `webhookCallback(bot, "hono")` | Production — receives updates via HTTP POST |

**Switching between modes**: Don't call `bot.start()` in production. Use `webhookCallback` instead. They are mutually exclusive.

---

## 4. Hono (Backend Framework)

### 4.1 Basic Server Setup

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Built-in middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "https://vendly.vercel.app"],
}));

// Routes
app.get("/", (c) => c.json({ status: "ok" }));
app.get("/health", (c) => c.json({ healthy: true }));

// Start server
serve({ fetch: app.fetch, port: Number(process.env.PORT) || 8080 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
```

### 4.2 Route Grouping

```typescript
// api/catalog.ts
const catalogRoutes = new Hono();
catalogRoutes.get("/products", (c) => c.json({ products: [] }));
catalogRoutes.get("/products/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ product: { id } });
});

// api/inference.ts
const inferenceRoutes = new Hono();
inferenceRoutes.post("/chat", async (c) => {
  const body = await c.req.json();
  return c.json({ response: "..." });
});

// index.ts — mount sub-routers
app.route("/api/catalog", catalogRoutes);
app.route("/api/inference", inferenceRoutes);
```

### 4.3 Error Handling

```typescript
import { HTTPException } from "hono/http-exception";

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Throwing HTTP errors
app.get("/api/protected", (c) => {
  throw new HTTPException(401, { message: "Unauthorized" });
});
```

### 4.4 Request/Response Patterns

```typescript
// Query parameters
app.get("/api/search", (c) => {
  const q = c.req.query("q");           // ?q=zapatos
  const limit = c.req.query("limit");   // ?limit=10
  return c.json({ query: q, limit });
});

// JSON body
app.post("/api/chat", async (c) => {
  const { message, chatId } = await c.req.json();
  return c.json({ reply: "..." });
});

// Headers
app.get("/api/info", (c) => {
  const authHeader = c.req.header("Authorization");
  return c.json({ auth: authHeader });
});

// Setting response headers
app.get("/api/data", (c) => {
  c.header("X-Custom-Header", "value");
  return c.json({ data: "..." });
});
```

---

## 5. Anthropic Claude API

### 5.1 Basic Message API

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: "You are a helpful sales assistant for a shoe store in Latin America. Respond in Spanish.",
  messages: [
    { role: "user", content: "Hola, tienen zapatillas Nike?" },
  ],
});

// Extract text response
const reply = response.content[0].type === "text"
  ? response.content[0].text
  : "";
```

### 5.2 Multi-Turn Conversations

The API is **stateless** — you must pass the full conversation history every call:

```typescript
type Message = { role: "user" | "assistant"; content: string };

async function chat(
  conversationHistory: Message[],
  newMessage: string,
  systemPrompt: string
): Promise<string> {
  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: newMessage },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].type === "text"
    ? response.content[0].text
    : "";

  return reply;
}
```

### 5.3 Sales Agent System Prompt (Template)

```typescript
const SALES_SYSTEM_PROMPT = `You are Vendly, an AI sales assistant for "{businessName}", a {businessType} in Latin America.

PERSONALITY:
- Friendly, warm, professional — like a great salesperson
- Respond in the customer's language (default: Spanish)
- Use casual but respectful tone ("tú" not "usted" unless the customer uses "usted")
- Keep responses concise (2-4 sentences max) — this is a chat, not an email

CAPABILITIES:
- You have access to the product catalog. When products are provided, recommend the most relevant ones.
- You can share prices, availability, and product details.
- If a customer seems ready to buy, guide them to place an order.

RULES:
- NEVER invent products that aren't in the catalog
- NEVER make up prices
- If you don't have information, say "Déjame verificar eso" and ask the user to wait
- Always be honest about stock availability

CURRENT CATALOG:
{catalogData}
`;
```

### 5.4 Streaming (Nice-to-Have)

```typescript
const stream = anthropic.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: "...",
  messages: [{ role: "user", content: "Hola" }],
});

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

### 5.5 Key API Details

- **Model**: `claude-sonnet-4-6` (recommended for sales — good reasoning, fast)
- **Max tokens**: Set to 1024 for chat (keeps responses concise + saves cost)
- **Rate limits**: Tier 1 = 50 RPM, 40K input tokens/min — plenty for demo
- **Cost**: ~$3/1M input tokens, ~$15/1M output tokens (Sonnet)
- **Stateless**: Every call needs full message history. Store messages in Supabase.

---

## 6. Supabase (Database + Realtime)

### 6.1 Client Setup

```typescript
import { createClient } from "@supabase/supabase-js";

// Backend — use service key (full access, bypasses RLS)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Frontend — use anon key (respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 6.2 CRUD Operations

```typescript
// INSERT — log a transaction
const { data, error } = await supabase
  .from("transactions")
  .insert({
    business_id: DEMO_BUSINESS_ID,
    conversation_id: conversationId,
    service: "catalog",
    endpoint: "/api/products",
    amount_usdc: 0.001,
    stellar_tx_hash: "abc123...",
    status: "completed",
  })
  .select()
  .single();

// SELECT — get recent transactions
const { data: transactions } = await supabase
  .from("transactions")
  .select("*")
  .eq("business_id", DEMO_BUSINESS_ID)
  .order("created_at", { ascending: false })
  .limit(50);

// SELECT with join — get messages for a conversation
const { data: messages } = await supabase
  .from("messages")
  .select("*")
  .eq("conversation_id", conversationId)
  .order("created_at", { ascending: true });

// UPSERT — create or update conversation
const { data: conversation } = await supabase
  .from("conversations")
  .upsert(
    {
      business_id: DEMO_BUSINESS_ID,
      telegram_chat_id: chatId,
      customer_name: firstName,
      last_message_at: new Date().toISOString(),
    },
    { onConflict: "telegram_chat_id" }
  )
  .select()
  .single();
```

### 6.3 Realtime Subscriptions (Dashboard)

```typescript
// Subscribe to new transactions in real-time
const channel = supabase
  .channel("transactions-feed")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "transactions",
      filter: `business_id=eq.${DEMO_BUSINESS_ID}`,
    },
    (payload) => {
      console.log("New transaction:", payload.new);
      // Update UI — add to transaction feed
    }
  )
  .subscribe();

// Cleanup
// channel.unsubscribe();
```

### 6.4 Realtime in Next.js (React Hook Pattern)

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  service: string;
  endpoint: string;
  amount_usdc: number;
  stellar_tx_hash: string;
  created_at: string;
}

export function useTransactionFeed(businessId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("transactions")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTransactions(data);
      });

    // Real-time subscription
    const channel = supabase
      .channel("tx-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [businessId]);

  return transactions;
}
```

### 6.5 Important Supabase Notes

- **Enable Realtime**: You must run `ALTER PUBLICATION supabase_realtime ADD TABLE transactions;` in the SQL editor. Without this, the subscription won't receive events.
- **RLS (Row Level Security)**: For the demo, either disable RLS on tables or create a permissive policy. Using the service key on the backend bypasses RLS.
- **Anon key is safe to expose**: The anon key is designed to be used in frontends. RLS policies control what data is accessible.

---

## 7. Telegram Bot API

### 7.1 BotFather Setup

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Choose a name: "Vendly Sales Assistant"
4. Choose a username: `vendly_sales_bot` (must end in `bot`)
5. Copy the token: `123456789:AABBCCDDEEFFaabbccddeeff`

### 7.2 Useful BotFather Commands

```
/setdescription    — Set bot description (shown before user starts chat)
/setabouttext      — Set "About" text in bot profile
/setcommands       — Set command list (shows in menu):
  start - Iniciar conversación
  help - Ver opciones de ayuda
  productos - Ver catálogo
  balance - Ver balance del agente
```

### 7.3 Message Types Available

| Type | grammY Filter | Use Case |
|---|---|---|
| Text | `bot.on("message:text")` | Main conversation handler |
| Photo | `bot.on("message:photo")` | Customer sends product photos |
| Callback Query | `bot.callbackQuery(...)` | Inline keyboard button press |
| Command | `bot.command("start")` | `/start`, `/help` commands |

### 7.4 Setting Webhook (Production)

```typescript
// Run once after deploying the backend
await bot.api.setWebhook("https://your-backend.up.railway.app/telegram/webhook", {
  drop_pending_updates: true,  // Ignore messages sent while bot was offline
});

// Verify webhook is set
const info = await bot.api.getWebhookInfo();
console.log(info);

// Remove webhook (switch back to long polling for dev)
await bot.api.deleteWebhook();
```

### 7.5 Message Formatting

```typescript
// HTML mode (recommended for Telegram)
await ctx.reply(
  `<b>Nike Air Max 90</b>\n` +
  `Precio: <b>$89.99</b>\n` +
  `Color: Blanco/Negro\n` +
  `<i>En stock - entrega 2-3 días</i>`,
  { parse_mode: "HTML" }
);

// Supported HTML tags: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="">
```

---

## 8. Deployment (Railway + Vercel)

### 8.1 Railway (Backend + Catalog Service)

Railway auto-detects Node.js projects. Key config:

```json
// backend/package.json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Railway environment variables**: Set via the Railway dashboard or CLI. Railway provides `PORT` automatically — always use `process.env.PORT`.

**Two separate Railway services**:
1. `vendly-backend` — main agent server (Hono + grammY + Claude + x402 client)
2. `vendly-catalog` — separate x402-protected catalog service (proves inter-service payment)

### 8.2 Vercel (Frontend)

Next.js deploys to Vercel with zero config. Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
NEXT_PUBLIC_BUSINESS_ID=<demo-business-uuid>
NEXT_PUBLIC_STELLAR_PUBLIC_KEY=GXXXXXXX
```

### 8.3 CORS Configuration

The backend must allow requests from the Vercel frontend:

```typescript
import { cors } from "hono/cors";

app.use("*", cors({
  origin: [
    "http://localhost:3000",           // Local dev
    "https://vendly.vercel.app",       // Production frontend
  ],
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-PAYMENT"],
}));
```

---

## Quick Reference Card

| Need | Solution |
|---|---|
| Protect an endpoint with x402 | `paymentMiddleware(routeConfig, resourceServer)` from `@x402/hono` |
| Pay for an x402 endpoint | `wrapFetchWithPayment(fetch, client)` from `@x402/fetch` |
| Create Stellar signer | `createEd25519Signer(secret, "stellar:testnet")` |
| Get USDC balance | Horizon API: `GET /accounts/{pubkey}` → find USDC in balances |
| Send Telegram message | `ctx.reply("text")` in grammY handler |
| Add inline buttons | `new InlineKeyboard().text("label", "callback_data")` |
| Call Claude API | `anthropic.messages.create({ model, system, messages })` |
| Real-time DB updates | Supabase `.channel().on("postgres_changes", ...).subscribe()` |
| Hono sub-router | `app.route("/prefix", subApp)` |
| Webhook for Telegram | `webhookCallback(bot, "hono")` mounted on a POST route |
