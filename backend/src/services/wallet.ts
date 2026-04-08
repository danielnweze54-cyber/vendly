import { env } from "../config/env.js";

const STELLAR_NETWORK = env.STELLAR_NETWORK;
const HORIZON_BASE =
  STELLAR_NETWORK === "testnet"
    ? "https://horizon-testnet.stellar.org"
    : "https://horizon.stellar.org";

export interface WalletBalance {
  usdc: number;
  xlm: number;
  isLow: boolean;
}

// Minimum USDC balance before warning (enough for ~100 inference calls)
const LOW_BALANCE_THRESHOLD = 0.5;

// Cached balance to avoid hammering Horizon
let _cachedBalance: WalletBalance | null = null;
let _balanceCacheTime = 0;
const BALANCE_CACHE_TTL = 30_000; // 30 seconds

/**
 * Fetch the agent's USDC and XLM balance from Stellar Horizon.
 * Cached for 30 seconds to avoid rate limits.
 */
export async function getWalletBalance(): Promise<WalletBalance> {
  const now = Date.now();
  if (_cachedBalance && now - _balanceCacheTime < BALANCE_CACHE_TTL) {
    return _cachedBalance;
  }

  try {
    const res = await fetch(
      `${HORIZON_BASE}/accounts/${env.AGENT_STELLAR_PUBLIC}`
    );
    if (!res.ok) {
      throw new Error(`Horizon returned ${res.status}`);
    }

    const data = await res.json();
    const balances: Array<{
      asset_type: string;
      asset_code?: string;
      balance: string;
    }> = data.balances;

    const usdc = Number(
      balances.find((b) => b.asset_code === "USDC")?.balance ?? "0"
    );
    const xlm = Number(
      balances.find((b) => b.asset_type === "native")?.balance ?? "0"
    );

    const balance: WalletBalance = {
      usdc,
      xlm,
      isLow: usdc < LOW_BALANCE_THRESHOLD,
    };

    if (balance.isLow) {
      console.warn(
        `[WALLET] Low USDC balance: ${usdc.toFixed(4)} USDC (threshold: ${LOW_BALANCE_THRESHOLD})`
      );
    }

    _cachedBalance = balance;
    _balanceCacheTime = now;
    return balance;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[WALLET] Failed to fetch balance:", msg);
    // Return last known balance or zeros
    return _cachedBalance ?? { usdc: 0, xlm: 0, isLow: true };
  }
}

/**
 * Check if the agent has enough USDC for a given payment amount.
 */
export async function hasEnoughBalance(amount: number): Promise<boolean> {
  const balance = await getWalletBalance();
  return balance.usdc >= amount;
}

/**
 * Custom error class for x402 payment failures.
 */
export class PaymentError extends Error {
  public readonly type: "insufficient_funds" | "network_error" | "payment_rejected" | "unknown";

  constructor(message: string, type: PaymentError["type"]) {
    super(message);
    this.name = "PaymentError";
    this.type = type;
  }
}

/**
 * Classify an error from fetchWithPayment into a PaymentError.
 */
export function classifyPaymentError(error: unknown): PaymentError {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (
    lower.includes("insufficient") ||
    lower.includes("trustline entry is missing") ||
    lower.includes("underfunded")
  ) {
    return new PaymentError(msg, "insufficient_funds");
  }

  if (
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout") ||
    lower.includes("network")
  ) {
    return new PaymentError(msg, "network_error");
  }

  if (
    lower.includes("simulation failed") ||
    lower.includes("payment_rejected") ||
    lower.includes("402")
  ) {
    return new PaymentError(msg, "payment_rejected");
  }

  return new PaymentError(msg, "unknown");
}
