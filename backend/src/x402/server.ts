import { x402ResourceServer } from "@x402/hono";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { env } from "../config/env.js";

// Resource server verifies incoming payments on x402-protected routes
export const resourceServer = new x402ResourceServer();
resourceServer.register(`stellar:${env.STELLAR_NETWORK}`, new ExactStellarScheme());

// Route pricing configuration — maps HTTP routes to their x402 payment requirements
// Payments go to the platform wallet (separate from the agent's spending wallet)
const payTo = env.PLATFORM_STELLAR_PUBLIC || env.AGENT_STELLAR_PUBLIC;

export const routeConfig = {
  "POST /api/inference": {
    accepts: {
      scheme: "exact",
      price: "$0.005",
      network: `stellar:${env.STELLAR_NETWORK}`,
      payTo,
    },
  },
} as const;
