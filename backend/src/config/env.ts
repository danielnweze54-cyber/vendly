import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  // Anthropic
  ANTHROPIC_API_KEY: required("ANTHROPIC_API_KEY"),

  // Telegram
  TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),

  // Stellar
  STELLAR_NETWORK: optional("STELLAR_NETWORK", "testnet"),
  AGENT_STELLAR_SECRET: required("AGENT_STELLAR_SECRET"),
  AGENT_STELLAR_PUBLIC: required("AGENT_STELLAR_PUBLIC"),
  STELLAR_RPC_URL: optional("STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
  X402_FACILITATOR_URL: optional("X402_FACILITATOR_URL", "https://www.x402.org/facilitator"),

  // Supabase
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: required("SUPABASE_SERVICE_KEY"),

  // Catalog Service
  CATALOG_SERVICE_URL: optional("CATALOG_SERVICE_URL", "http://localhost:8081"),

  // App
  PORT: Number(optional("PORT", "8080")),
} as const;
