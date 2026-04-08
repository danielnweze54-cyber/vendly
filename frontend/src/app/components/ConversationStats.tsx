"use client";

import { useEffect, useState } from "react";
import { supabase, DEMO_BUSINESS_ID } from "@/lib/supabase";

interface ConversationStat {
  id: string;
  customer_name: string;
  telegram_chat_id: number;
  created_at: string;
  last_message_at: string;
  message_count: number;
  total_cost: number;
}

export default function ConversationStats() {
  const [conversations, setConversations] = useState<ConversationStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Fetch conversations
      const { data: convos, error: convError } = await supabase
        .from("conversations")
        .select("id, customer_name, telegram_chat_id, created_at, last_message_at")
        .eq("business_id", DEMO_BUSINESS_ID)
        .order("last_message_at", { ascending: false })
        .limit(10);

      if (convError || !convos) {
        console.error("Failed to fetch conversations:", convError?.message);
        setLoading(false);
        return;
      }

      // For each conversation, get message count and transaction cost
      const stats: ConversationStat[] = await Promise.all(
        convos.map(async (c) => {
          const { count: msgCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", c.id);

          const { data: txData } = await supabase
            .from("transactions")
            .select("amount_usdc")
            .eq("conversation_id", c.id);

          const totalCost = txData
            ? txData.reduce((sum, tx) => sum + Number(tx.amount_usdc), 0)
            : 0;

          return {
            ...c,
            message_count: msgCount ?? 0,
            total_cost: totalCost,
          };
        })
      );

      setConversations(stats);
      setLoading(false);
    }

    fetchStats();
    const interval = setInterval(fetchStats, 15_000);
    return () => clearInterval(interval);
  }, []);

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Conversations
        </h2>
        <p className="text-sm text-gray-500">
          Active customer sessions
        </p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-400 text-sm">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-400 text-sm">
            No conversations yet. Customers will appear here when they message
            the bot.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {conversations.map((c) => (
            <li
              key={c.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {c.customer_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.message_count} messages | Last active: {timeAgo(c.last_message_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${c.total_cost.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">USDC spent</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
