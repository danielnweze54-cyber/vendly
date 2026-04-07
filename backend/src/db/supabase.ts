import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Backend uses service key — bypasses RLS
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// Demo business ID — set after seeding, or query at startup
let _demoBusinessId: string | null = null;

export async function getDemoBusinessId(): Promise<string> {
  if (_demoBusinessId) return _demoBusinessId;

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("name", "Demo Zapatería")
    .single();

  if (error || !data) {
    throw new Error(
      "Demo business not found. Run `npm run seed` first. Error: " +
        (error?.message ?? "No data")
    );
  }

  _demoBusinessId = data.id as string;
  return _demoBusinessId!;
}

// --- Conversation helpers ---

export async function getOrCreateConversation(
  businessId: string,
  telegramChatId: number,
  customerName?: string
) {
  // Try to find existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("telegram_chat_id", telegramChatId)
    .single();

  if (existing) {
    // Update last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      business_id: businessId,
      telegram_chat_id: telegramChatId,
      customer_name: customerName ?? "Unknown",
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data;
}

// --- Message helpers ---

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
  if (error) console.error("Failed to save message:", error.message);
}

export async function getConversationHistory(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load history:", error.message);
    return [];
  }
  return data ?? [];
}

// --- Transaction helpers ---

export async function logTransaction(params: {
  businessId: string;
  conversationId?: string;
  service: string;
  endpoint: string;
  amountUsdc: number;
  stellarTxHash?: string;
}) {
  const { error } = await supabase.from("transactions").insert({
    business_id: params.businessId,
    conversation_id: params.conversationId,
    service: params.service,
    endpoint: params.endpoint,
    amount_usdc: params.amountUsdc,
    stellar_tx_hash: params.stellarTxHash ?? "pending",
    status: "completed",
  });
  if (error) console.error("Failed to log transaction:", error.message);
}
