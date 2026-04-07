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
  CATALOG_STELLAR_PUBLIC: required("CATALOG_STELLAR_PUBLIC"),
  STELLAR_NETWORK: optional("STELLAR_NETWORK", "testnet"),
  X402_FACILITATOR_URL: optional("X402_FACILITATOR_URL", "https://www.x402.org/facilitator"),
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("SUPABASE_ANON_KEY"),
  PORT: Number(optional("PORT", "8081")),
} as const;
