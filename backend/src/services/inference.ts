import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const inferenceRoutes = new Hono();

/**
 * POST /api/inference
 * x402-protected AI inference endpoint.
 *
 * Accepts a JSON body with:
 *   - messages: Array of { role: "user" | "assistant", content: string }
 *   - system: Optional system prompt
 *
 * Returns Claude's response. Each call costs $0.005 via x402.
 */
inferenceRoutes.post("/", async (c) => {
  const body = await c.req.json<{
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    system?: string;
  }>();

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: "messages array is required" }, 400);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: body.system ?? "You are a helpful assistant.",
      messages: body.messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return c.json({
      response: text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Inference error:", message);
    return c.json({ error: "Inference failed" }, 500);
  }
});
