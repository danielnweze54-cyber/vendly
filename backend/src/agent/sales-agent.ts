import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { SALES_SYSTEM_PROMPT } from "./prompts.js";
import type { Message } from "../services/types.js";

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

/**
 * Get a response from the Claude sales agent.
 *
 * Claude's API is stateless — we pass the full conversation history every call.
 * The system prompt includes the current product catalog so the agent can
 * recommend real products with accurate prices.
 */
export async function getAgentResponse(
  conversationHistory: Message[],
  newMessage: string,
  catalogData: string
): Promise<string> {
  // Build the system prompt with injected catalog
  const systemPrompt = SALES_SYSTEM_PROMPT.replace("{catalogData}", catalogData);

  // Build messages array: existing history + new user message
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...conversationHistory
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user", content: newMessage },
  ];

  // Claude requires alternating user/assistant messages.
  // Deduplicate consecutive same-role messages by merging them.
  const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const msg of messages) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      last.content += "\n" + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  // Ensure first message is from user (Claude requirement)
  if (merged.length > 0 && merged[0].role !== "user") {
    merged.shift();
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: merged,
    });

    // Extract text response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return "Sorry, I couldn't generate a response. Please try again.";
    }

    return textBlock.text;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Claude API error:", message);

    // Provide user-friendly error messages
    if (message.includes("rate_limit")) {
      return "I'm handling a lot of requests right now. Give me a moment and try again.";
    }
    if (message.includes("authentication") || message.includes("api_key")) {
      console.error("CRITICAL: Anthropic API key is invalid or missing");
      return "There's a technical issue. The team has been notified.";
    }

    return "There was a problem processing your message. Please try again in a moment.";
  }
}
