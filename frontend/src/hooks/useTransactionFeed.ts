"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, DEMO_BUSINESS_ID } from "@/lib/supabase";

export interface Transaction {
  id: string;
  service: string;
  endpoint: string;
  amount_usdc: number;
  stellar_tx_hash: string;
  status: string;
  created_at: string;
}

export function useTransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial transactions
  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, service, endpoint, amount_usdc, stellar_tx_hash, status, created_at")
      .eq("business_id", DEMO_BUSINESS_ID)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch transactions:", error.message);
      return;
    }

    if (data) {
      setTransactions(data);
      const total = data.reduce((sum, tx) => sum + Number(tx.amount_usdc), 0);
      setTotalSpent(total);
    }
  }, []);

  useEffect(() => {
    // Load initial data
    fetchTransactions();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel("tx-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `business_id=eq.${DEMO_BUSINESS_ID}`,
        },
        (payload) => {
          const newTx = payload.new as Transaction;
          setTransactions((prev) => [newTx, ...prev].slice(0, 50));
          setTotalSpent((prev) => prev + Number(newTx.amount_usdc));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  return { transactions, totalSpent, isConnected };
}
