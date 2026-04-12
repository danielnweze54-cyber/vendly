import { Bot } from "grammy";
import { env } from "../config/env.js";
import {
  getDemoBusinessId,
  getOrCreateConversation,
  saveMessage,
  getConversationHistory,
  logTransaction,
} from "../db/supabase.js";
import { getAgentResponse } from "../agent/sales-agent.js";
import { getCatalogData } from "../services/catalog.js";
import { getWalletBalance } from "../services/wallet.js";

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// /start command
bot.command("start", async (ctx) => {
  await ctx.reply(
    "Hey there! I'm the sales assistant for <b>Demo Sneaker Shop</b>.\n\n" +
      "Ask me about our products, prices, and availability.\n\n" +
      "Just type a message to get started. For example:\n" +
      '- "Do you have Nike sneakers?"\n' +
      '- "What are the cheapest options?"\n' +
      '- "Show me everything you have"',
    { parse_mode: "HTML" }
  );
});

// /help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    "<b>Available commands:</b>\n\n" +
      "/start — Start a conversation\n" +
      "/help — Show this help\n" +
      "/products — View full catalog\n" +
      "/status — View agent status\n\n" +
      "Or just type what you're looking for.",
    { parse_mode: "HTML" }
  );
});

// /products command — shows full catalog
bot.command("products", async (ctx) => {
  try {
    const catalog = await getCatalogData();
    const lines = catalog
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .join("\n");
    await ctx.reply(`<b>Our catalog:</b>\n\n${lines}`, {
      parse_mode: "HTML",
    });
  } catch {
    await ctx.reply(
      "Couldn't load the catalog right now. Please try again."
    );
  }
});

// /status command — shows agent wallet status
bot.command("status", async (ctx) => {
  try {
    const balance = await getWalletBalance();
    const statusIcon = balance.isLow ? "!!" : "OK";
    await ctx.reply(
      `<b>Agent status:</b>\n\n` +
        `USDC: ${balance.usdc.toFixed(4)} [${statusIcon}]\n` +
        `XLM: ${balance.xlm.toFixed(2)}\n` +
        `Network: stellar:${env.STELLAR_NETWORK}\n` +
        `Wallet: <code>${env.AGENT_STELLAR_PUBLIC.slice(0, 8)}...${env.AGENT_STELLAR_PUBLIC.slice(-4)}</code>` +
        (balance.isLow
          ? "\n\nLow balance — some features may be unavailable."
          : ""),
      { parse_mode: "HTML" }
    );
  } catch {
    await ctx.reply("Couldn't check the status. Please try again.");
  }
});

// Main message handler — Claude sales agent
bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const customerName = ctx.from?.first_name ?? "Customer";

  console.log(`[BOT] Message from ${customerName} (${chatId}): ${userMessage}`);

  try {
    const businessId = await getDemoBusinessId();
    const conversation = await getOrCreateConversation(
      businessId,
      chatId,
      customerName
    );

    // Save user message
    await saveMessage(conversation.id, "user", userMessage);

    // Check wallet balance and warn if low
    const balance = await getWalletBalance();
    if (balance.isLow) {
      console.warn(`[BOT] Low USDC balance: ${balance.usdc.toFixed(4)}`);
    }

    // Load conversation history for Claude context
    const history = await getConversationHistory(conversation.id);
    console.log(`[BOT] History: ${history.length} msgs, USDC: ${balance.usdc.toFixed(4)}`);

    // Get catalog data (via x402 catalog-service with Supabase fallback)
    const catalogData = await getCatalogData();

    // Call Claude sales agent
    console.log(`[BOT] Calling Claude...`);
    const reply = await getAgentResponse(history, userMessage, catalogData);
    console.log(`[BOT] Claude replied (${reply.length} chars)`);

    // Save assistant response
    await saveMessage(conversation.id, "assistant", reply);

    // Log inference transaction (Claude API call)
    await logTransaction({
      businessId,
      conversationId: conversation.id,
      service: "inference",
      endpoint: "/api/inference",
      amountUsdc: 0.005,
      stellarTxHash: "x402-auto",
    });

    await ctx.reply(reply);
    console.log(`[BOT] Reply sent to ${customerName}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Message handler error:", msg);

    // Provide specific error messages based on failure type
    if (msg.includes("insufficient") || msg.includes("underfunded")) {
      await ctx.reply(
        "Sorry, I need to top up my balance to keep helping. " +
          "Please try again in a moment."
      );
    } else if (msg.includes("rate_limit") || msg.includes("429")) {
      await ctx.reply(
        "I'm handling a lot of requests right now. Give me a moment and try again."
      );
    } else if (msg.includes("api_key") || msg.includes("authentication")) {
      console.error("CRITICAL: API key issue");
      await ctx.reply("There's a technical issue. The team has been notified.");
    } else {
      await ctx.reply(
        "Sorry, something went wrong. Please try again in a moment."
      );
    }
  }
});

// Error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});
