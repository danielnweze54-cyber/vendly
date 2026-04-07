# Vendly — AI Sales Agent with x402 Micropayments

## 1. What We're Building

An AI sales agent that lives in **Telegram**, serves LatAm SMB customers 24/7, and **autonomously pays for every API it consumes** — transaction by transaction — via **x402 on Stellar**. No subscriptions. No contracts. The agent tops up USDC like prepaid phone credit.

### 1.1 Why This Wins the Hackathon

| Criteria | How Vendly Scores |
|---|---|
| **x402 usage** | Every AI inference, every catalog lookup, every translation triggers a real x402 payment on Stellar |
| **Novelty** | First agent that combines commerce + messaging + autonomous micropayments |
| **Demo quality** | Live Telegram chat → real-time payment feed on dashboard — judges see money move |
| **Real pain point** | LatAm SMBs need 24/7 sales but can't afford SaaS subscriptions — pay-per-use fits perfectly |
| **Feasibility** | TypeScript everywhere, Telegram Bot API is instant (no Meta approval), existing x402-stellar SDK |

### 1.2 Key Strategic Decisions

| Original Plan | Improved Plan | Why |
|---|---|---|
| WhatsApp Business API | **Telegram Bot API** | Instant setup (5 min vs days), no Meta approval, free, rich UI (inline buttons, menus) |
| Go + Fiber backend | **TypeScript + Hono** | x402-stellar SDK is TS-native — no porting needed, single language across the stack |
| x402 pays internal services only | **x402 pays at least 1 external service** | Proves the protocol's real value — agents paying strangers, not themselves |
| Full WhatsApp + Dashboard | **Telegram first, dashboard second** | De-risks the demo — Telegram works Day 1, dashboard is polish |
| Multi-tenant from Day 1 | **Hardcoded single business, multi-tenant schema** | Schema is future-proof but demo skips login/auth — saves 1-2 days |

---

## 2. The Complete Product Flow

```
Customer (Telegram)          Vendly Agent (TS)              x402 Services (Stellar)
      │                            │                               │
      │  "Hola, tienen zapatos?"   │                               │
      ├───────────────────────────>│                               │
      │                            │── x402 pay ──> /catalog       │
      │                            │<── 200 + products ────────────│
      │                            │── x402 pay ──> /ai-inference  │
      │                            │<── 200 + response ────────────│
      │  "Sí! Tenemos 3 modelos..." │                              │
      │<───────────────────────────│                               │
      │                            │── log tx to Supabase ────>    │
      │                            │                               │
   Owner (Dashboard)               │                               │
      │  sees real-time tx feed    │                               │
      │  sees wallet balance       │                               │
      │  sees conversation stats   │                               │
```

---

## 3. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Runtime** | Node.js 20+ / TypeScript | Same language as x402-stellar SDK |
| **Backend Framework** | Hono | Lightweight, fast, middleware-friendly |
| **AI** | Claude API (Anthropic SDK) | Best reasoning for sales conversations |
| **Messaging** | Telegram Bot API (grammY) | Instant setup, rich UI, free |
| **Payments** | x402-stellar SDK | Native TS, handles 402 flow + Stellar signing |
| **Blockchain** | Stellar Testnet → Mainnet | USDC micropayments, fast finality |
| **Database** | Supabase (Postgres + Realtime) | Real-time TX feed for dashboard, free tier |
| **Frontend** | Next.js 14 + Tailwind | Dashboard for business owner |
| **Deploy** | Railway (backend) + Vercel (frontend) | Free tiers, easy setup |

---

## 4. Architecture

### 4.1 Directory Structure

```
vendly/
├── backend/                        # Hono + TypeScript — main agent server
│   ├── src/
│   │   ├── index.ts                # Entry point — Hono server
│   │   ├── bot/
│   │   │   ├── telegram.ts         # grammY bot setup + handlers
│   │   │   └── commands.ts         # /start, /help, /balance commands
│   │   ├── agent/
│   │   │   ├── sales-agent.ts      # Claude conversation loop
│   │   │   └── prompts.ts          # System prompts for sales agent
│   │   ├── x402/
│   │   │   ├── server.ts           # x402ResourceServer + paywall route config
│   │   │   └── client.ts           # x402Client + wrapFetchWithPayment setup
│   │   ├── services/
│   │   │   ├── catalog.ts          # Local catalog endpoint (x402 protected)
│   │   │   ├── inference.ts        # AI inference endpoint (x402 protected)
│   │   │   └── types.ts            # Shared service types
│   │   ├── db/
│   │   │   ├── supabase.ts         # Supabase client + queries
│   │   │   └── seed.ts             # Demo data seeding script
│   │   └── config/
│   │       └── env.ts              # Environment config with validation
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── catalog-service/                # SEPARATE x402-protected service (deployed independently)
│   ├── src/
│   │   ├── index.ts                # Hono server with x402 paywall
│   │   └── products.ts             # Product data + endpoints
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                       # Next.js 14
│   ├── app/
│   │   ├── page.tsx                # Dashboard (no login — hardcoded demo business)
│   │   └── components/
│   │       ├── WalletCard.tsx       # USDC balance display
│   │       └── TxFeed.tsx           # Real-time transaction feed
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── PLAN.md                     # This file
├── .gitignore
└── .env.example
```

> **Note:** The `catalog-service/` is deployed as a **separate Railway instance** with its own URL.
> This proves the x402 "external service" requirement — the agent genuinely pays a different server
> it doesn't control, demonstrating inter-service x402 micropayments.

### 4.2 Environment Variables

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...

# Stellar
STELLAR_NETWORK=testnet
AGENT_STELLAR_SECRET=Sxxxxxxx
AGENT_STELLAR_PUBLIC=Gxxxxxxx
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
X402_FACILITATOR_URL=https://www.x402.org/facilitator

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# Catalog Service (separate deployment for external x402 demo)
CATALOG_SERVICE_URL=https://vendly-catalog.up.railway.app

# App
PORT=8080
```

### 4.3 x402 Payment Flow (TypeScript — Using Official SDK)

> The `@x402/*` packages (v2.x) provide ready-made middleware and fetch wrappers.
> We do NOT need to hand-roll the 402 flow — the SDK handles it.

**Server side — protecting endpoints with `@x402/hono`:**

```typescript
// x402/server.ts
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { env } from "../config/env";

const facilitator = new HTTPFacilitatorClient({
  url: env.X402_FACILITATOR_URL,  // https://www.x402.org/facilitator
});

const resourceServer = new x402ResourceServer(facilitator)
  .register("stellar:testnet", new ExactStellarScheme());

export const x402Routes = {
  "GET /api/catalog": {
    accepts: {
      scheme: "exact" as const,
      price: "$0.001",
      network: "stellar:testnet",
      payTo: env.AGENT_STELLAR_PUBLIC,
    },
  },
  "POST /api/inference": {
    accepts: {
      scheme: "exact" as const,
      price: "$0.005",
      network: "stellar:testnet",
      payTo: env.AGENT_STELLAR_PUBLIC,
    },
  },
};

export { paymentMiddleware, resourceServer };
```

**Client side — agent paying for a service with `@x402/fetch`:**

```typescript
// x402/client.ts
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { env } from "../config/env";

const signer = createEd25519Signer(env.AGENT_STELLAR_SECRET, "stellar:testnet");

const client = new x402Client()
  .register("stellar:*", new ExactStellarScheme(signer, {
    url: env.STELLAR_RPC_URL,  // https://soroban-testnet.stellar.org
  }));

// This fetch wrapper handles the full 402 → sign payment → retry flow automatically
export const fetchWithPayment = wrapFetchWithPayment(fetch, client);
```

**Usage in the agent — calling an x402-protected service:**

```typescript
// agent/sales-agent.ts (simplified)
import { fetchWithPayment } from "../x402/client";
import { env } from "../config/env";

async function getProducts(query: string) {
  // fetchWithPayment handles: GET → 402 → sign USDC payment → retry → 200
  const res = await fetchWithPayment(
    `${env.CATALOG_SERVICE_URL}/api/products?q=${encodeURIComponent(query)}`
  );
  return res.json();
}
```

### 4.4 Supabase Schema

> **Multi-tenancy note:** The schema supports multiple businesses via `business_id` foreign keys,
> but the demo will hardcode a single business. No auth/login is needed for the dashboard —
> we query with a fixed `business_id`. This keeps the schema production-ready while avoiding
> auth implementation during the hackathon.

```sql
-- Business owners (dashboard users)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  telegram_bot_token TEXT,        -- their bot token
  stellar_public_key TEXT,        -- agent's wallet
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (catalog data)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  telegram_chat_id BIGINT NOT NULL,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  message_count INT DEFAULT 0
);

-- Messages (agent context)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- x402 Transactions (real-time feed)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  conversation_id UUID REFERENCES conversations(id),
  service TEXT NOT NULL,            -- e.g. 'catalog', 'ai-inference', 'translate'
  endpoint TEXT NOT NULL,           -- e.g. '/api/catalog'
  amount_usdc DECIMAL(10,7),       -- 7 decimals (Stellar USDC precision)
  stellar_tx_hash TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Supabase Realtime on transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Seed the demo business (run once after creating tables)
INSERT INTO businesses (name, telegram_bot_token, stellar_public_key)
VALUES ('Demo Zapatería', 'SET_VIA_ENV', 'SET_VIA_ENV');
```

### 4.5 NPM Packages

**Backend (`backend/package.json`):**

| Package | Version | Purpose |
|---|---|---|
| `hono` | `^4.7` | Lightweight web framework |
| `@hono/node-server` | `^1.13` | Node.js adapter for Hono |
| `@x402/core` | `^2.8.0` | x402 core types + facilitator client |
| `@x402/hono` | `^2.8.0` | x402 paywall middleware for Hono |
| `@x402/stellar` | `^2.8.0` | Stellar payment scheme (server + client variants) |
| `@x402/fetch` | `^2.8.0` | Fetch wrapper with automatic 402 → pay → retry |
| `@stellar/stellar-sdk` | `^14.6.1` | Stellar SDK (required by @x402/stellar) |
| `grammy` | `^1.30` | Telegram Bot framework |
| `@anthropic-ai/sdk` | `^0.39` | Claude API client |
| `@supabase/supabase-js` | `^2.47` | Supabase client (Postgres + Realtime) |
| `dotenv` | `^16.4` | Environment variable loading |
| `tsx` | `^4.19` | TypeScript execution for development |
| `typescript` | `^5.6` | TypeScript compiler |

**Catalog Service (`catalog-service/package.json`):**

| Package | Version | Purpose |
|---|---|---|
| `hono` | `^4.7` | Web framework |
| `@hono/node-server` | `^1.13` | Node.js adapter |
| `@x402/core` | `^2.8.0` | x402 core (facilitator client) |
| `@x402/hono` | `^2.8.0` | x402 paywall middleware |
| `@x402/stellar` | `^2.8.0` | Stellar scheme (server-side only) |
| `@supabase/supabase-js` | `^2.47` | Read products from Supabase |

**Frontend (`frontend/package.json`):**

| Package | Version | Purpose |
|---|---|---|
| `next` | `^14.2` | React framework with App Router |
| `react` / `react-dom` | `^18.3` | UI library |
| `tailwindcss` | `^3.4` | Utility-first CSS |
| `@supabase/supabase-js` | `^2.47` | Supabase Realtime for live TX feed |

### 4.6 Stellar x402 Gotchas

These are critical implementation details discovered from studying the SDK source code:

1. **USDC uses 7 decimals on Stellar** (not 6 like on EVM chains). `$0.01` = `100000` raw token units. The SDK handles conversion when you use dollar-prefixed strings like `"$0.001"` in route config.

2. **Soroban, not classic Stellar**: x402 uses Soroban smart contract token transfers (SEP-41 `transfer(from, to, amount)`), not classic Stellar payment operations. This is handled transparently by the SDK.

3. **Facilitator sponsors all fees**: The agent never needs XLM for gas. The public facilitator at `https://www.x402.org/facilitator` sponsors transaction fees on testnet. The client transaction uses `fee: "1"` (minimum valid) as a placeholder.

4. **Client signs auth entries, not transactions**: `createEd25519Signer(secretKey, network)` produces a signer for Soroban authorization entries only. The facilitator wraps signed auth entries into a full transaction and submits it on-chain.

5. **Testnet USDC comes from Circle Faucet**: Use the [Circle Faucet](https://faucet.circle.com/) and select "Stellar" network. Friendbot only gives XLM (needed for account activation, not for payments).

6. **Import paths are different for server vs client**:
   - Server: `import { ExactStellarScheme } from "@x402/stellar/exact/server"` — no signer needed
   - Client: `import { ExactStellarScheme } from "@x402/stellar/exact/client"` — requires signer + RPC config
   - Same class name, different implementations.

7. **Soroban RPC URL is required**: The client must connect to `https://soroban-testnet.stellar.org` for transaction simulation and ledger state queries.

8. **Legacy packages don't support Stellar**: The old `x402-express` and `x402-fetch` (v1.x) are EVM/Solana only. Always use the scoped `@x402/*` packages (v2.x).

9. **Network identifiers use CAIP-2 format**: Stellar testnet = `"stellar:testnet"`, pubnet = `"stellar:pubnet"`. Client registration uses wildcard matching: `client.register("stellar:*", scheme)`.

---

## 5. Day-by-Day Plan (10 Days)

### Phase 1: Foundation (Days 1–3)

#### Day 1 — Skeleton + Telegram Bot + SDK Validation

- [ ] Initialize monorepo: `backend/` (Hono + TS), `catalog-service/` (Hono + TS), `frontend/` (Next.js)
- [ ] Set up `.gitignore`, `.env.example`, `tsconfig.json` for each package
- [ ] Install all `@x402/*` packages — verify imports resolve correctly
- [ ] Run the [x402-Stellar-Demo quickstart](https://github.com/jamesbachini/x402-Stellar-Demo) end-to-end to validate the payment flow works
- [ ] Create Telegram bot via @BotFather (takes 2 minutes)
- [ ] Implement basic grammY bot: `/start`, echo messages
- [ ] Set up Supabase project + run schema SQL (including `products` table)
- [ ] Generate Stellar testnet keypair + fund via Friendbot (XLM) + Circle Faucet (USDC)
- [ ] **Milestone:** Bot echoes on Telegram + x402 quickstart payment succeeds on testnet

#### Day 2 — Claude Agent Loop

- [ ] Integrate Anthropic SDK — sales agent with system prompt
- [ ] Build conversation memory: load/save messages from Supabase
- [ ] Wire Telegram messages → Claude → Telegram responses
- [ ] Create the sales system prompt (LatAm tone, product-aware)
- [ ] Test: have a full sales conversation in Telegram
- [ ] **Milestone:** Bot has a natural sales conversation in Spanish

#### Day 3 — x402 Payment Layer Integration

- [ ] Implement `x402/server.ts` — `x402ResourceServer` + `paymentMiddleware` with route config
- [ ] Implement `x402/client.ts` — `x402Client` + `wrapFetchWithPayment` setup
- [ ] Create a test endpoint: `GET /api/catalog` behind x402 paywall on backend
- [ ] Test: agent's `fetchWithPayment` calls `/api/catalog`, gets 402, SDK pays, gets data
- [ ] Log the first payment to `transactions` table in Supabase
- [ ] **Milestone:** First x402 payment on Stellar testnet triggered by the agent

### Phase 2: Core Product (Days 4–6)

#### Day 4 — Wire x402 Into Agent Flow + Seed Data

- [ ] Seed `products` table with 8-10 demo products (shoes, clothing — LatAm store theme)
- [ ] Create catalog service with sample products (protected by x402)
- [ ] Create AI inference endpoint (proxy to Claude, protected by x402)
- [ ] Modify sales agent to call services via `fetchWithPayment`
- [ ] Log every transaction to `transactions` table in Supabase
- [ ] Test: customer asks about products → agent pays for catalog + AI → responds
- [ ] **Milestone:** Full flow — Telegram message triggers x402 payments

#### Day 5 — Dashboard (Core)

- [ ] Set up Next.js frontend with Tailwind
- [ ] Build `WalletCard` component — shows USDC balance (query Stellar Horizon API)
- [ ] Build `TxFeed` component — real-time feed via Supabase Realtime subscription
- [ ] Create single-page dashboard layout (no login — hardcoded demo business_id)
- [ ] Connect frontend to Supabase
- [ ] **Milestone:** Dashboard shows live payments as agent handles conversations

#### Day 6 — External x402 Service + Robustness

- [ ] Deploy `catalog-service/` as a **separate Railway instance** with its own URL
- [ ] Configure backend agent to call the external catalog service URL via `fetchWithPayment`
- [ ] Verify the agent genuinely pays a different server (different Railway URL = different service)
- [ ] Handle edge cases: insufficient balance, failed payments, Stellar errors
- [ ] Add balance check before transactions, low-balance alert in dashboard
- [ ] Add conversation stats to dashboard (message count, cost per conversation)
- [ ] **Milestone:** Agent pays an external x402 service + graceful error handling

### Phase 3: Polish + Demo (Days 7–10)

#### Day 7 — Deploy + Integration Test

- [ ] Deploy backend to Railway
- [ ] Deploy catalog-service to Railway (separate instance)
- [ ] Deploy frontend to Vercel
- [ ] Set Telegram webhook to Railway URL
- [ ] Run full end-to-end test on deployed infra
- [ ] Fix any deployment issues (CORS, env vars, networking)
- [ ] **Milestone:** Everything works on production URLs

#### Day 8 — Demo Prep + Polish

- [ ] Write the 90-second demo script (see Section 7)
- [ ] Add visual polish: loading states, animations on new transactions
- [ ] Add a "Top Up" button on dashboard (sends testnet USDC to agent wallet)
- [ ] Verify `db/seed.ts` creates compelling demo data (products, sample business)
- [ ] Practice the demo flow 3 times

#### Day 9 — Buffer + Nice-to-Haves

- [ ] Buffer day for bugs, edge cases, deployment issues
- [ ] Nice-to-have: conversation simulator in dashboard (no Telegram needed for demo)
- [ ] Nice-to-have: cost breakdown chart (which services cost the most)
- [ ] Nice-to-have: multi-language support via translation service

#### Day 10 — Final Demo Day

- [ ] Final end-to-end test on production
- [ ] Record backup video of the demo (in case live demo fails)
- [ ] Prepare 2-3 slides: problem, solution, architecture
- [ ] **Ship it**

---

## 6. Repos to Study (In Order)

### 6.1 Day 1 Priority (Read Before Writing Code)

| Repo | What to Learn |
|---|---|
| [x402-stellar](https://github.com/stellar/x402-stellar) | Core x402 SDK — the payment middleware and client logic we'll use directly |
| [x402-Stellar-Demo](https://github.com/jamesbachini/x402-Stellar-Demo) | Minimal working example of x402 flow — understand the 402 → pay → retry cycle |
| [stellar-sponsored-agent-account](https://github.com/oceans404/stellar-sponsored-agent-account) | How to create agent wallets without needing XLM upfront |

### 6.2 Reference (Days 2–4)

| Repo | What to Learn |
|---|---|
| [x402 protocol spec](https://github.com/coinbase/x402) | The original x402 spec by Coinbase — understand the protocol deeply |
| [grammY docs](https://grammy.dev/) | Telegram bot framework — handlers, middleware, keyboards |
| [Hono docs](https://hono.dev/) | Backend framework — routing, middleware, context |
| [Stellar JS SDK](https://github.com/stellar/js-stellar-sdk) | USDC transactions, account management, horizon queries |

### 6.3 Essential Documentation

- [x402 Protocol Spec](https://www.x402.org/)
- [Stellar USDC Guide](https://developers.stellar.org/docs/tokens/usdc)
- [Anthropic Claude API](https://docs.anthropic.com/en/api)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 7. Demo Script — 90 Seconds

### Setup (Before Demo Starts)

- Dashboard open on screen, showing wallet balance (e.g., 5.00 USDC)
- Transaction feed empty
- Telegram app open on phone (or second screen)

### The Demo

**[0:00–0:15] The Problem**

> "LatAm SMBs lose sales every night because nobody answers customer messages.
> SaaS subscriptions don't work here — businesses need pay-as-you-go.
> Meet Vendly."

**[0:15–0:45] Live Interaction**

> *Opens Telegram, sends:* "Hola, tienen zapatillas Nike?"
>
> *Agent responds naturally in Spanish with product options.*
>
> *Points to dashboard:* "Every API call the agent just made — catalog lookup,
> AI inference — was paid individually via x402 on Stellar. See the transactions
> appearing in real time."
>
> *Dashboard shows 2-3 transactions with USDC amounts and Stellar TX hashes.*

**[0:45–1:05] The x402 Magic**

> "The agent has its own Stellar wallet with USDC. When it calls any API,
> it gets a 402 response, signs a micropayment, and retries. No subscriptions.
> No API keys to manage. Just money."
>
> *Points to wallet card:* "Balance went from 5.000 to 4.997 USDC.
> Three API calls, three micropayments."

**[1:05–1:25] The Vision**

> "This works with ANY x402-enabled service. Translation APIs, search,
> data providers — the agent discovers the price and pays on the spot.
> It's how machines will buy services from each other."

**[1:25–1:30] Close**

> "Vendly. AI sales that pay their own way."

---

## 8. Pre-Hackathon Checklist

### Accounts & Credentials (Get These Ready Now)

- [ ] Anthropic API Key — [console.anthropic.com](https://console.anthropic.com)
- [ ] Telegram Bot — talk to [@BotFather](https://t.me/BotFather), get token
- [ ] Supabase project created — [supabase.com](https://supabase.com)
- [ ] Railway account — [railway.app](https://railway.app)
- [ ] Vercel account — [vercel.com](https://vercel.com)
- [ ] Stellar testnet keypair — [Stellar Laboratory](https://laboratory.stellar.org/)
- [ ] Fund testnet account with XLM via Friendbot
- [ ] Fund testnet account with USDC via [Circle Faucet](https://faucet.circle.com/) (select Stellar network)
- [ ] Freighter wallet extension installed (for manual testing)

### SDK Validation (Do Before Day 1 Coding)

- [ ] Clone and run [x402-Stellar-Demo quickstart](https://github.com/jamesbachini/x402-Stellar-Demo) end-to-end
- [ ] Verify `@x402/hono` middleware returns 402 on a hello-world endpoint
- [ ] Verify `wrapFetchWithPayment` handles the 402 → pay → retry flow
- [ ] Confirm the public facilitator (`https://www.x402.org/facilitator`) works with `stellar:testnet`

### Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| x402-stellar SDK issues | High | Study the source Day 1, have a manual fallback (direct Stellar SDK calls) |
| Stellar testnet down | Medium | Cache last-known-good responses, mock payment layer |
| Claude rate limits | Medium | Cache AI responses per product query, use shorter prompts |
| Demo day network issues | High | Record backup video on Day 8, have local fallback |
| Supabase realtime lag | Low | Polling fallback every 2s for the TX feed |

---

## 9. Success Criteria

By demo day, the following must work end-to-end:

1. **Customer sends Telegram message** → bot responds as a sales agent
2. **Every API call triggers a visible x402 payment** on Stellar testnet
3. **Dashboard shows real-time transaction feed** as payments happen
4. **Wallet balance decreases** with each interaction
5. **At least one external x402 service** is called (not just internal)
6. **The whole thing runs on deployed infrastructure** (not localhost)
