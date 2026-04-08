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
    "¡Hola! Soy el asistente de ventas de <b>Demo Zapatería</b>.\n\n" +
      "Pregúntame sobre nuestros productos, precios y disponibilidad.\n\n" +
      "Escribe cualquier mensaje para empezar. Por ejemplo:\n" +
      '- "¿Tienen zapatillas Nike?"\n' +
      '- "¿Cuáles son las más baratas?"\n' +
      '- "Quiero ver todas las opciones"',
    { parse_mode: "HTML" }
  );
});

// /help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    "<b>Comandos disponibles:</b>\n\n" +
      "/start — Iniciar conversación\n" +
      "/help — Ver esta ayuda\n" +
      "/productos — Ver catálogo completo\n" +
      "/estado — Ver estado del agente\n\n" +
      "O simplemente escríbeme lo que buscas.",
    { parse_mode: "HTML" }
  );
});

// /productos command — shows full catalog
bot.command("productos", async (ctx) => {
  try {
    const catalog = await getCatalogData();
    const lines = catalog
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .join("\n");
    await ctx.reply(`<b>Nuestro catálogo:</b>\n\n${lines}`, {
      parse_mode: "HTML",
    });
  } catch {
    await ctx.reply(
      "No pude cargar el catálogo en este momento. Intenta de nuevo."
    );
  }
});

// /estado command — shows agent wallet status
bot.command("estado", async (ctx) => {
  try {
    const balance = await getWalletBalance();
    const statusIcon = balance.isLow ? "!!" : "OK";
    await ctx.reply(
      `<b>Estado del agente:</b>\n\n` +
        `USDC: ${balance.usdc.toFixed(4)} [${statusIcon}]\n` +
        `XLM: ${balance.xlm.toFixed(2)}\n` +
        `Red: stellar:${env.STELLAR_NETWORK}\n` +
        `Wallet: <code>${env.AGENT_STELLAR_PUBLIC.slice(0, 8)}...${env.AGENT_STELLAR_PUBLIC.slice(-4)}</code>` +
        (balance.isLow
          ? "\n\nSaldo bajo — algunas funciones pueden no estar disponibles."
          : ""),
      { parse_mode: "HTML" }
    );
  } catch {
    await ctx.reply("No pude consultar el estado. Intenta de nuevo.");
  }
});

// Main message handler — Claude sales agent
bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const customerName = ctx.from?.first_name ?? "Cliente";

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
        "Lo siento, necesito recargar mi saldo para seguir atendiendo. " +
          "Intenta de nuevo en un momento."
      );
    } else if (msg.includes("rate_limit") || msg.includes("429")) {
      await ctx.reply(
        "Estoy atendiendo muchas consultas. Dame un momento e intenta de nuevo."
      );
    } else if (msg.includes("api_key") || msg.includes("authentication")) {
      console.error("CRITICAL: API key issue");
      await ctx.reply("Hay un problema técnico. El equipo ya fue notificado.");
    } else {
      await ctx.reply(
        "Lo siento, hubo un error. Intenta de nuevo en un momento."
      );
    }
  }
});

// Error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});
