import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { env } from "../config/env.js";

// Ed25519 signer for Soroban auth entries — signs payment authorizations
const signer = createEd25519Signer(
  env.AGENT_STELLAR_SECRET,
  `stellar:${env.STELLAR_NETWORK}`
);

// x402 client with Stellar scheme — handles the 402 → sign → retry flow
const client = new x402Client().register(
  "stellar:*",
  new ExactStellarScheme(signer, {
    url: env.STELLAR_RPC_URL,
  })
);

// Wrapped fetch that automatically handles x402 payments
// Use this instead of native fetch when calling x402-protected endpoints
export const fetchWithPayment = wrapFetchWithPayment(fetch, client);
