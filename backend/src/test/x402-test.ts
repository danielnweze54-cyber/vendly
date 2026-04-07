/**
 * x402 Payment Flow Test Script
 *
 * Tests the 402 → pay → retry flow against local or remote x402-protected endpoints.
 *
 * Usage:
 *   # Test against local backend inference endpoint
 *   npx tsx src/test/x402-test.ts http://localhost:8080/api/inference
 *
 *   # Test against local catalog service
 *   npx tsx src/test/x402-test.ts http://localhost:8081/api/products
 *
 *   # Test against deployed catalog service
 *   npx tsx src/test/x402-test.ts https://vendly-catalog.up.railway.app/api/products
 *
 * Requires: .env with AGENT_STELLAR_SECRET, AGENT_STELLAR_PUBLIC, STELLAR_RPC_URL
 */
import "dotenv/config";
import { fetchWithPayment } from "../x402/client.js";

const url = process.argv[2];

if (!url) {
  console.error("Usage: npx tsx src/test/x402-test.ts <URL>");
  console.error("Example: npx tsx src/test/x402-test.ts http://localhost:8081/api/products");
  process.exit(1);
}

async function testWithoutPayment() {
  console.log(`\n--- Test 1: Request WITHOUT payment ---`);
  console.log(`GET ${url}\n`);

  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);

    if (res.status === 402) {
      console.log("Got 402 Payment Required (expected)");
      const body = await res.text();
      console.log(`Response preview: ${body.substring(0, 200)}...`);
      return true;
    } else {
      console.log("WARNING: Expected 402 but got", res.status);
      console.log("The endpoint may not have x402 middleware applied.");
      return false;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Request failed:", msg);
    return false;
  }
}

async function testWithPayment() {
  console.log(`\n--- Test 2: Request WITH x402 payment ---`);

  const isPost = url.includes("/inference");
  const fetchUrl = url;
  const fetchOptions: RequestInit = isPost
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello, this is a test." }],
          system: "Reply in exactly 5 words.",
        }),
      }
    : {};

  console.log(`${isPost ? "POST" : "GET"} ${fetchUrl}`);
  console.log("Using fetchWithPayment (auto 402 → sign → retry)\n");

  try {
    const res = await fetchWithPayment(fetchUrl, fetchOptions);
    console.log(`Status: ${res.status} ${res.statusText}`);

    if (res.ok) {
      const body = await res.json();
      console.log("Response:", JSON.stringify(body, null, 2).substring(0, 500));
      console.log("\nSUCCESS: x402 payment flow works end-to-end!");
      return true;
    } else {
      console.log("FAILED: Got non-200 status after payment attempt");
      const body = await res.text();
      console.log("Response:", body.substring(0, 300));
      return false;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Payment flow failed:", msg);
    return false;
  }
}

async function main() {
  console.log("=== x402 Payment Flow Test ===");
  console.log(`Target: ${url}`);
  console.log(`Network: stellar:${process.env.STELLAR_NETWORK ?? "testnet"}`);
  console.log(`Agent: ${process.env.AGENT_STELLAR_PUBLIC ?? "NOT SET"}`);

  const got402 = await testWithoutPayment();

  if (!got402) {
    console.log("\nSkipping payment test — endpoint did not return 402.");
    console.log("Make sure the server is running and x402 middleware is applied.");
    process.exit(1);
  }

  const paymentWorked = await testWithPayment();
  process.exit(paymentWorked ? 0 : 1);
}

main();
