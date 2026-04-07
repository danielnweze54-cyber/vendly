import { Bot } from "grammy";
import { env } from "../config/env.js";
import { getDemoBusinessId, getOrCreateConversation, saveMessage, getConversationHistory } from "../db/supabase.js";

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// /start command
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 ¡Hola! Soy el asistente de ventas de <b>Demo Zapatería</b>.\n\n" +
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

// /productos command — placeholder until catalog service is wired
bot.command("productos", async (ctx) => {
  await ctx.reply(
    "📦 <b>Nuestro catálogo:</b>\n\n" +
      "Tenemos zapatillas Nike, Adidas, Puma, New Balance, Converse, Reebok, y Vans.\n\n" +
      "Pregúntame por una marca o estilo y te doy detalles con precios.",
    { parse_mode: "HTML" }
  );
});

// Main message handler — echo for now, will be replaced with Claude agent
bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text;
  const customerName = ctx.from?.first_name ?? "Cliente";

  try {
    const businessId = await getDemoBusinessId();
    const conversation = await getOrCreateConversation(businessId, chatId, customerName);

    // Save user message
    await saveMessage(conversation.id, "user", userMessage);

    // TODO: Replace with Claude agent call (Day 2)
    const reply = `Echo: ${userMessage}\n\n(Agent AI coming soon — this confirms the bot and DB are working)`;

    // Save assistant message
    await saveMessage(conversation.id, "assistant", reply);

    await ctx.reply(reply);
  } catch (error) {
    console.error("Message handler error:", error);
    await ctx.reply("Lo siento, hubo un error. Intenta de nuevo en un momento.");
  }
});

// Error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});
