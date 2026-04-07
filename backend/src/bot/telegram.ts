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

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// /start command
bot.command("start", async (ctx) => {
  await ctx.reply(
    "¡Hola! Soy el asistente de ventas de <b>Demo Zapatería</b>.\n\n" +
      "Pregúntame sobre nuestros productos, precios y disponibilidad.\n\n" +
      "Escribe cualquier mensaje para empezar. Por ejemplo:\n" +
      '• "¿Tienen zapatillas Nike?"\n' +
      '• "¿Cuáles son las más baratas?"\n' +
      '• "Quiero ver todas las opciones"',
    { parse_mode: "HTML" }
  );
});

// /help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    "<b>Comandos disponibles:</b>\n\n" +
      "/start — Iniciar conversación\n" +
      "/help — Ver esta ayuda\n" +
      "/productos — Ver catálogo completo\n\n" +
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

// Main message handler — Claude sales agent
bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const customerName = ctx.from?.first_name ?? "Cliente";

  console.log(`[BOT] Message from ${customerName} (${chatId}): ${userMessage}`);

  try {
    const businessId = await getDemoBusinessId();
    console.log(`[BOT] Business ID: ${businessId}`);
    const conversation = await getOrCreateConversation(
      businessId,
      chatId,
      customerName
    );
    console.log(`[BOT] Conversation ID: ${conversation.id}`);

    // Save user message
    await saveMessage(conversation.id, "user", userMessage);

    // Load conversation history for Claude context
    const history = await getConversationHistory(conversation.id);
    console.log(`[BOT] History length: ${history.length} messages`);

    // Get catalog data (via x402 catalog-service with Supabase fallback)
    const catalogData = await getCatalogData();
    console.log(`[BOT] Catalog loaded (${catalogData.length} chars)`);

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
    console.error("Message handler error:", error);
    await ctx.reply(
      "Lo siento, hubo un error. Intenta de nuevo en un momento."
    );
  }
});

// Error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});
