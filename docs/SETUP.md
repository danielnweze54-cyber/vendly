# Vendly — Setup Guide

Steps to get the development environment running. Complete these **before** starting Day 2 implementation.

---

## 1. Accounts & Credentials

### 1.1 Telegram Bot

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Name: `Vendly Sales Assistant`
4. Username: `vendly_sales_bot` (or any name ending in `bot`)
5. Copy the token — looks like `123456789:AABBCCDDEEFFaabbccddeeff`

After creating:
```
/setdescription — "AI sales assistant powered by x402 micropayments"
/setcommands:
  start - Iniciar conversación
  help - Ver opciones de ayuda
  productos - Ver catálogo
```

### 1.2 Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy — looks like `sk-ant-api03-...`

### 1.3 Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note the **Project URL** and **anon key** (Settings → API)
3. Also copy the **service_role key** (same page, hidden by default)
4. Open the SQL Editor and run the schema below:

```sql
-- Business owners
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  telegram_bot_token TEXT,
  stellar_public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
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

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  conversation_id UUID REFERENCES conversations(id),
  service TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  amount_usdc DECIMAL(10,7),
  stellar_tx_hash TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on transactions (required for dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

### 1.4 Stellar Testnet Wallet

1. Go to [Stellar Laboratory](https://laboratory.stellar.org/) → Generate Keypair
2. Save the **Public Key** (`G...`) and **Secret Key** (`S...`)
3. **Fund with XLM**: `curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"`
4. **Fund with USDC**: Go to [Circle Faucet](https://faucet.circle.com/) → select **Stellar** → paste public key → request USDC

You need **both** XLM (account activation) and USDC (for x402 payments).

### 1.5 Railway & Vercel (for deployment — can defer to Day 7)

- [railway.app](https://railway.app) — for backend + catalog-service
- [vercel.com](https://vercel.com) — for frontend

---

## 2. Local Environment Setup

### 2.1 Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values:
#   ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN,
#   AGENT_STELLAR_SECRET, AGENT_STELLAR_PUBLIC,
#   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
```

### 2.2 Catalog Service

```bash
cp catalog-service/.env.example catalog-service/.env
# Edit catalog-service/.env:
#   CATALOG_STELLAR_PUBLIC (can be same key as agent for testing)
#   SUPABASE_URL, SUPABASE_ANON_KEY
```

### 2.3 Seed Demo Data

After Supabase schema is created and `.env` files are set:

```bash
cd backend
npm run seed
```

This creates the "Demo Zapatería" business and 8 products. Note the **business ID** printed — you'll need it for the frontend.

### 2.4 Run Development Servers

**Terminal 1 — Backend** (port 8080):
```bash
cd backend
npm run dev
```

**Terminal 2 — Catalog Service** (port 8081):
```bash
cd catalog-service
npm run dev
```

**Terminal 3 — Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

---

## 3. Validation Checklist

After setup, verify each piece works:

- [ ] `backend/` compiles: `cd backend && npx tsc --noEmit`
- [ ] `catalog-service/` compiles: `cd catalog-service && npx tsc --noEmit`
- [ ] `frontend/` builds: `cd frontend && npm run build`
- [ ] Supabase tables exist (check in Supabase dashboard → Table Editor)
- [ ] Seed data created: `cd backend && npm run seed` — shows 8 products
- [ ] Backend starts: `cd backend && npm run dev` — prints server info
- [ ] Telegram bot responds to `/start` (send it a message in Telegram)
- [ ] Stellar wallet has USDC balance (check on [Stellar Expert](https://stellar.expert/explorer/testnet))
