# Vendly Landing Page Structure

## Purpose
Sell Vendly as a product — an AI-powered sales agent for LatAm SMBs. The core message: **you only pay for what you use**. No subscriptions, no contracts — every AI call is a micropayment you can see on-chain. Target both business owners and hackathon judges.

**Core narrative**: Traditional SaaS charges you $99-499/month whether you use it or not. Vendly flips the model — each message costs a fraction of a cent, paid instantly via x402 micropayments on Stellar. You fund your wallet, and every penny is accounted for in real-time.

---

## Section 1: Hero

**Layout**: Full-width, gradient background (purple → dark), centered text + CTA

- **Headline**: "An AI Sales Rep That Costs You $0.005 Per Message"
- **Subheadline**: "No subscriptions. No contracts. No minimums. Vendly is a 24/7 AI sales agent on Telegram — you only pay for the messages it sends. Every cent is a real transaction you can verify."
- **Animated counter**: Live ticker showing "$0.005... $0.010... $0.015..." as messages flow — reinforcing the pay-per-use concept
- **Primary CTA**: "Try It Free" → `https://t.me/vendly_sales_bot`
- **Secondary CTA**: "Watch the Money Flow" → `https://vendly-rosy.vercel.app`
- **Visual**: Split mockup — phone with Telegram conversation on the left, dashboard showing live transaction feed on the right

---

## Section 2: The Problem With SaaS Pricing

**Layout**: Three columns with icons, dark background

- **Headline**: "You're Paying for AI You Don't Use"
- **Pain Point 1**: "Monthly Subscriptions" — Chatbot platforms charge $99-499/month. Quiet month? You still pay. Busy month? You hit limits and pay overages.
- **Pain Point 2**: "Hidden Costs" — API keys, usage tiers, seat licenses, setup fees. You never know what you'll actually spend until the invoice arrives.
- **Pain Point 3**: "Zero Transparency" — Where does your money go? SaaS billing is a black box. You can't verify what you paid for.
- **Transition line**: "What if you could see every single cent your AI agent spends — in real-time?"

---

## Section 3: Pay Only for What You Use

**Layout**: Centered, large typography with cost visualization

- **Headline**: "Every Message Has a Price. Every Price Has a Receipt."
- **Visual**: Animated flow diagram showing:
  ```
  Customer sends message → AI thinks ($0.005) → Catalog lookup ($0.001) → Reply sent
                                   ↓                        ↓
                           Stellar TX: 0.005 USDC    Stellar TX: 0.001 USDC
                                   ↓                        ↓
                           Dashboard updates in real-time
  ```
- **Key points** (large, bold):
  - "$0.005" — cost of one AI response
  - "$0.001" — cost of one catalog query
  - "$0.03" — average full conversation (5 messages)
  - "$30" — cost of 1,000 customer conversations per month
- **Comparison callout**: "A human sales rep costs $1,200/month. Vendly handles the same volume for $30. And it never sleeps."

---

## Section 4: See Where Every Penny Goes

**Layout**: Full-width dashboard screenshot/embed with annotations

- **Headline**: "Real-Time Spending Dashboard — Not a Monthly Invoice"
- **Screenshot**: Live dashboard showing wallet balance, transaction feed, per-conversation costs
- **Annotation callouts** pointing to:
  - Wallet balance (USDC on Stellar)
  - Live transaction feed with Stellar TX hashes
  - Per-service cost breakdown (AI inferences vs. catalog queries)
  - Conversation-level spending
- **Key message**: "Every transaction is a real USDC payment on Stellar. Click any TX hash to verify it on the blockchain. This isn't a billing estimate — it's cryptographic proof of what you spent."
- **CTA**: "See It Live" → `https://vendly-rosy.vercel.app`

---

## Section 5: How It Works

**Layout**: Horizontal stepper (1-2-3), clean and simple

1. **Fund Your Wallet** — Add USDC to your Stellar wallet. Start with $5 — that's 1,000 AI responses. Top up anytime.
2. **Connect Your Catalog** — Add your products: names, prices, descriptions. Your AI agent learns them instantly.
3. **Share Your Bot Link** — Customers message your Telegram bot. Vendly answers 24/7. You see every transaction in real-time.

- **Bottom note**: "No setup fees. No monthly minimum. No commitment. If you stop using it, you stop paying. Your USDC stays in your wallet."

---

## Section 6: Live Demo

**Layout**: Two-column, interactive

- **Left Column**: Embedded Telegram conversation GIF showing:
  - Customer: "Tienen zapatillas Nike?"
  - Bot responds with 3 products, prices, and sizes
  - Customer: "Cuanto cuesta la Air Max?"
  - Bot gives price, offers to check other colors
  - **Overlay**: Small cost badge on each message showing "$0.005", "$0.006"
- **Right Column**: Dashboard showing those same transactions appearing in real-time
- **CTA**: "Message the Bot Now — It's Free to Try" → `https://t.me/vendly_sales_bot`

---

## Section 7: Pricing — Transparent by Design

**Layout**: Centered comparison card

- **Headline**: "Compare the Real Cost"

| | SaaS Chatbot | Human Sales Rep | Vendly |
|---|---|---|---|
| Monthly Cost | $99-499/mo fixed | $800-1500/mo | Pay per message |
| 100 conversations | $99 (same price) | $1,200 (same price) | ~$3 |
| 1,000 conversations | $99-499 | $1,200 | ~$30 |
| 10,000 conversations | $499+ overages | Need 3+ reps | ~$300 |
| Availability | 24/7 | 8-10 hrs/day | 24/7 |
| Billing transparency | Monthly invoice | Salary | Every TX on-chain |
| Unused months | You still pay | You still pay | $0 |

- **Bottom line**: "Vendly scales with you. Sell more → pay a little more. Sell nothing → pay nothing."

---

## Section 8: The Technology Behind It

**Layout**: Icon grid, slightly technical (for judges + curious business owners)

- **Headline**: "How Pay-Per-Use AI Actually Works"
- **x402 Protocol**: "The x402 standard adds payments to HTTP. When your AI agent needs to think, it pays $0.005 via a standard HTTP header. No billing API, no usage tracking — the payment IS the request."
- **Stellar + USDC**: "Payments settle in under 5 seconds on Stellar using USDC stablecoins. Transaction fees are $0.00001. Your customers never touch crypto — it's all behind the scenes."
- **Service-to-Service Payments**: "Your AI agent pays for catalog access the same way it pays for AI inference — per request, verified on-chain. Every microservice in the stack earns and spends independently."
- **Open & Verifiable**: "Every payment has a Stellar transaction hash. Anyone can verify it. No trust required."

---

## Section 9: Use Cases

**Layout**: Three cards with illustrations

- **Card 1 — Retail**: "A shoe store in Mexico City. 200 customer messages/day. Cost: ~$1/day. Previously: $1,200/month for a sales rep who worked 8 hours."
- **Card 2 — Food**: "A bakery in Bogota. 50 custom cake inquiries/week. Cost: ~$6/month. Previously: owner spent 2 hours/day answering the same questions."
- **Card 3 — Services**: "A barber shop in Buenos Aires. 30 booking requests/day. Cost: ~$0.90/day. Previously: missed 60% of messages outside business hours."

- **Each card shows**: conversation count, monthly Vendly cost, what they paid before

---

## Section 10: Roadmap

**Layout**: Vertical timeline

- **Now**: Telegram bot, AI sales agent, product catalog, real-time spending dashboard, x402 micropayments
- **Next**: WhatsApp Business, order management, payment collection via chat, multi-business support
- **Future**: Inventory sync, conversion analytics, marketplace of specialized AI agents (sales, support, bookings), fiat on-ramp for easy wallet funding

---

## Section 11: CTA / Footer

**Layout**: Full-width dark section, high contrast

- **Headline**: "Stop Paying for AI You Don't Use"
- **Subheadline**: "Fund your wallet. Share your bot link. Pay per message."
- **Primary CTA**: "Try the Demo Bot" → `https://t.me/vendly_sales_bot`
- **Secondary CTA**: "Watch Transactions Live" → `https://vendly-rosy.vercel.app`
- **Third CTA**: "View Source Code" → `https://github.com/t0k1dev/vendly`
- **Links**: x402 Protocol, Stellar Network, GitHub
- **Badge**: "Built for the x402 Hackathon on Stellar"
- **Footer**: "Vendly — AI sales agents powered by micropayments. You use it, you pay for it. Nothing more."

---

## Design Notes

- **Color palette**: Purple primary (#7C3AED), dark navy background (#0F172A), white cards, green accents for money/payments
- **Typography**: Clean sans-serif (Inter or similar), large headlines, readable body text
- **Mobile-first**: Most LatAm SMB owners browse on phones
- **Trust signals**: Real Stellar TX hashes, live dashboard embed, open-source badge, USDC logo
- **Tone**: Direct and honest. "You pay for what you use" should feel empowering, not cheap. Emphasize transparency and control. Avoid crypto jargon — say "digital dollars" instead of "stablecoins" in business-facing copy, keep "USDC on Stellar" for technical sections.
- **Recurring motif**: Dollar amounts ($0.005, $0.03, $30) should appear throughout — every section reinforces that the user knows exactly what they're paying.
