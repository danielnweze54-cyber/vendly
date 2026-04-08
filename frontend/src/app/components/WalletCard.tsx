"use client";

import { useEffect, useState } from "react";
import { STELLAR_PUBLIC_KEY, STELLAR_NETWORK } from "@/lib/supabase";

const LOW_BALANCE_THRESHOLD = 0.5;

interface WalletCardProps {
  totalSpent: number;
}

export default function WalletCard({ totalSpent }: WalletCardProps) {
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      const horizonBase =
        STELLAR_NETWORK === "testnet"
          ? "https://horizon-testnet.stellar.org"
          : "https://horizon.stellar.org";

      try {
        const res = await fetch(
          `${horizonBase}/accounts/${STELLAR_PUBLIC_KEY}`
        );
        if (!res.ok) throw new Error(`Horizon returned ${res.status}`);

        const data = await res.json();
        const balances: Array<{
          asset_type: string;
          asset_code?: string;
          balance: string;
        }> = data.balances;

        const usdc = balances.find((b) => b.asset_code === "USDC");
        const xlm = balances.find((b) => b.asset_type === "native");

        setUsdcBalance(usdc?.balance ?? "0");
        setXlmBalance(xlm?.balance ?? "0");
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Failed to fetch Stellar balance:", msg);
        setError("Could not load wallet");
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 30_000);
    return () => clearInterval(interval);
  }, []);

  const usdcNum = Number(usdcBalance ?? 0);
  const isLow = usdcNum < LOW_BALANCE_THRESHOLD && usdcNum > 0;
  const isEmpty = usdcNum === 0 && !loading && !error;

  const shortKey = STELLAR_PUBLIC_KEY
    ? `${STELLAR_PUBLIC_KEY.slice(0, 6)}...${STELLAR_PUBLIC_KEY.slice(-4)}`
    : "Not configured";

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg max-w-md w-full transition hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold opacity-90 uppercase tracking-wider">
          Agent Wallet
        </h2>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
          {STELLAR_NETWORK}
        </span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-white/20 rounded w-32" />
          <div className="h-4 bg-white/20 rounded w-24" />
        </div>
      ) : error ? (
        <p className="text-white/70 text-sm">{error}</p>
      ) : (
        <>
          {/* Low balance alert */}
          {(isLow || isEmpty) && (
            <div className="mb-3 px-3 py-2 bg-red-500/30 border border-red-400/50 rounded-lg">
              <p className="text-sm font-medium">
                {isEmpty ? "No USDC balance" : "Low USDC balance"}
              </p>
              <p className="text-xs opacity-80">
                {isEmpty
                  ? "Fund your wallet to enable x402 payments"
                  : `Below $${LOW_BALANCE_THRESHOLD} — payments may fail soon`}
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-3xl font-bold tracking-tight">


              {usdcNum.toFixed(2)}{" "}
              <span className="text-lg font-normal opacity-80">USDC</span>
            </p>
            <p className="text-sm opacity-70 mt-1">
              {Number(xlmBalance).toFixed(2)} XLM
            </p>
          </div>

          <div className="border-t border-white/20 pt-4 mt-4 space-y-3">

            <div className="flex justify-between text-sm">
              <span className="opacity-70">Total Spent (x402)</span>
              <span className="font-semibold">
                ${totalSpent.toFixed(4)} USDC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Address</span>
              <span className="font-mono text-xs opacity-70 break-all">{shortKey}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
