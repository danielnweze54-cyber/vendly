// Placeholder — full Claude integration is Day 2
// For now, just export the types and a stub

import type { Message } from "../services/types.js";

export async function getAgentResponse(
  _conversationHistory: Message[],
  _newMessage: string,
  _catalogData: string
): Promise<string> {
  // TODO: Day 2 — Integrate Anthropic SDK
  return "Agent AI integration coming Day 2. This is a placeholder.";
}
