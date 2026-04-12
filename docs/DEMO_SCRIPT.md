# Vendly Demo Recording Script

## Overview

**Duration:** ~3 minutes
**Format:** Screen recording with voiceover
**Tone:** Confident, direct, clear. No hype — let the product speak.
**Tools needed:** Screen recorder (OBS/Loom), browser with landing page + dashboard, Telegram (phone or desktop)

---

## Pre-Recording Setup

1. **Landing page** open in browser: `https://landing-five-phi-13.vercel.app`
2. **Dashboard** open in a second tab: `https://vendly-rosy.vercel.app`
3. **Telegram** open with `@vendly_sales_bot` ready (phone or second screen)
4. Dashboard showing wallet balance (e.g., ~5.00 USDC)
5. Transaction feed with a few prior transactions (looks active, not empty)
6. Browser at 90% zoom, clean desktop, no distracting tabs

---

## Script

### PART 1 — The Problem [0:00–0:30]

**[SCREEN: Landing page hero section]**

> "Small businesses in Latin America lose sales every single night. A customer messages at 10 PM asking about a product — and nobody answers. By morning, they've already bought from someone else."

**[SCROLL to Problem section — three cards]**

> "The tools that exist don't work for these businesses. SaaS chatbots charge a hundred dollars a month — whether you get ten messages or ten thousand. There are hidden costs, usage tiers, and at the end of the month you get an invoice you can't really verify."

**[PAUSE on transition line: "What if you could see every single cent your AI agent spends — in real-time?"]**

> "We asked ourselves: what if there was a better model?"

---

### PART 2 — The Solution [0:30–1:00]

**[SCROLL to Pay Per Use section — cost flow diagram]**

> "This is Vendly. An AI sales agent that lives on Telegram and answers your customers 24/7. But here's what makes it different — you only pay for the messages it actually sends."

> "Every time the AI thinks, that's a transaction. Every time it looks up your product catalog, that's a transaction. Each one costs a fraction of a cent, and each one is a real USDC payment on the Stellar blockchain."

**[Point to cost stats: $0.005, $0.001, $0.03, $30]**

> "One AI response costs half a cent. A full conversation with a customer — about three cents. A thousand customer conversations in a month? Thirty dollars. Compare that to a human sales rep at twelve hundred a month."

---

### PART 3 — How It Works [1:00–1:20]

**[SCROLL to How It Works section — 3 steps]**

> "Setting it up takes three steps. Fund your Stellar wallet with USDC — even five dollars gives you a thousand responses. Add your products to the catalog. And share your bot link. That's it. No setup fees, no contracts. If you stop using it, you stop paying."

---

### PART 4 — Live Demo [1:20–2:20]

**[SWITCH to Telegram — bot conversation]**

> "Let me show you how this works live. I'm going to message the Vendly bot as if I were a customer."

**[TYPE in Telegram: "Do you have Nike sneakers?"]**

> "I'm asking if they have Nike sneakers..."

**[WAIT for bot response — it should list products with prices]**

> "The AI agent searched the product catalog, found the matching products, and responded with names, prices, and sizes. All in a few seconds."

**[SWITCH to Dashboard tab]**

> "Now look at the dashboard. Every API call the agent just made — the catalog lookup, the AI inference — each one triggered a real micropayment via the x402 protocol on Stellar."

**[Point to transaction feed — show new entries appearing]**

> "You can see each transaction right here. The service that was called, the exact amount in USDC, and the Stellar transaction hash. Click any of these hashes and you can verify it on the blockchain. This isn't an estimate — it's cryptographic proof of what you spent."

**[Point to wallet balance]**

> "The wallet balance went down by a fraction of a cent. That's the total cost of handling that customer interaction."

**[SWITCH back to Telegram — send another message: "How much is the Air Max?"]**

> "Let me ask a follow-up..."

**[WAIT for response]**

> "It remembers the context, gives me the price, and even offers to check for other colors. And on the dashboard..."

**[SWITCH to Dashboard]**

> "...two more transactions just appeared. The cost of this entire conversation so far is less than two cents."

---

### PART 5 — The Technology [2:20–2:45]

**[SWITCH to Landing page — scroll to Technology section]**

> "Under the hood, this works with the x402 protocol — an open standard that adds payments directly to HTTP. When the AI agent needs to call any service, it gets a 402 response, signs a USDC micropayment on Stellar, and retries. The payment IS the request. No billing APIs, no usage tracking — just money."

> "Payments settle in under five seconds. Transaction fees are practically zero. And the business owner never has to touch crypto — it's all behind the scenes."

---

### PART 6 — The Vision [2:45–3:00]

**[SCROLL to Pricing comparison table]**

> "Vendly scales with you. A hundred conversations costs three dollars. Ten thousand costs three hundred. And if you have a quiet month — you pay nothing."

**[SCROLL to Footer]**

> "This is Vendly. AI sales agents powered by micropayments. You use it, you pay for it. Nothing more."

**[Landing page CTA buttons visible: "Try the Demo Bot", "Watch Transactions Live", "View Source Code"]**

> "Try the demo bot yourself — the link is right here. Built for the x402 Hackathon on Stellar."

---

## Recording Tips

- **Pacing:** Don't rush. Let the dashboard transactions appear naturally — the real-time feed is the most impressive part.
- **Mouse movement:** Move the cursor deliberately to point at specific elements. Don't wave it around.
- **Telegram timing:** The bot takes 2-5 seconds to respond. Fill the silence with narration about what's happening ("The agent is looking up the catalog...").
- **If the bot is slow:** Have a backup recording of a successful interaction. Cut between live and pre-recorded if needed.
- **Audio:** Record in a quiet room. Use a decent microphone if available. Consistent volume matters more than studio quality.
- **Resolution:** Record at 1920x1080 minimum. Ensure text is readable.
- **Browser:** Use Chrome or Firefox. Hide bookmarks bar. Close all other tabs.

## Backup Plan

If the live demo fails (network issues, bot down, Stellar testnet problems):

1. Have a **pre-recorded screen capture** of a successful bot interaction + dashboard ready to splice in
2. Prepare **screenshots** of the dashboard with real transaction data as a last resort
3. The landing page itself tells the full story — in the worst case, walk through the landing page and reference "this is what it looks like when running live"
