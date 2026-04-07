import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Demo config — hardcoded for hackathon (no auth)
export const DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID!;
export const STELLAR_PUBLIC_KEY = process.env.NEXT_PUBLIC_STELLAR_PUBLIC_KEY!;
export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
