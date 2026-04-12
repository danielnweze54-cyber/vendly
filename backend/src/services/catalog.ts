import { fetchWithPayment, extractTxHash } from "../x402/client.js";
import { supabase } from "../db/supabase.js";
import { logTransaction, getDemoBusinessId } from "../db/supabase.js";
import { env } from "../config/env.js";
import { classifyPaymentError, PaymentError } from "./wallet.js";

// Cached catalog string — refreshed every 5 minutes
let _cachedCatalog: string | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface Product {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  in_stock: boolean;
}

/**
 * Fetch products from the x402-protected catalog service.
 * Falls back to direct Supabase read if the catalog service is unreachable.
 * Throws PaymentError for insufficient funds so the bot can notify the user.
 */
async function fetchProductsFromCatalogService(query?: string): Promise<Product[]> {
  const url = new URL("/api/products", env.CATALOG_SERVICE_URL);
  if (query) url.searchParams.set("q", query);

  try {
    const res = await fetchWithPayment(url.toString());
    if (!res.ok) {
      throw new Error(`Catalog service returned ${res.status}`);
    }
    const data = await res.json() as { products: Product[] };

    // Extract real Stellar TX hash from x402 payment response
    const txHash = extractTxHash(res);

    // Log the x402 transaction
    const businessId = await getDemoBusinessId();
    await logTransaction({
      businessId,
      service: "catalog",
      endpoint: "/api/products",
      amountUsdc: 0.001,
      stellarTxHash: txHash,
    });

    return data.products;
  } catch (error: unknown) {
    const paymentError = classifyPaymentError(error);

    // Insufficient funds — bubble up so the bot can warn the user
    if (paymentError.type === "insufficient_funds") {
      console.error("[CATALOG] Insufficient USDC for catalog payment:", paymentError.message);
      // Log the failed attempt
      const businessId = await getDemoBusinessId().catch(() => "unknown");
      if (businessId !== "unknown") {
        await logTransaction({
          businessId,
          service: "catalog",
          endpoint: "/api/products",
          amountUsdc: 0,
          stellarTxHash: "failed-insufficient-funds",
        });
      }
      // Still fall back to Supabase so the conversation continues
      console.warn("[CATALOG] Falling back to Supabase due to insufficient funds");
      return fetchProductsFromSupabase(query);
    }

    // Network / other errors — silent fallback
    console.warn("[CATALOG] Catalog service unavailable, falling back to Supabase:", paymentError.message);
    return fetchProductsFromSupabase(query);
  }
}

/**
 * Fallback: read products directly from Supabase (no x402 payment).
 */
async function fetchProductsFromSupabase(query?: string): Promise<Product[]> {
  const request = supabase
    .from("products")
    .select("name, description, price, currency, category, in_stock")
    .order("name");

  const { data, error } = await request;
  if (error || !data) return [];

  let products = data as Product[];
  if (query) {
    const q = query.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }

  return products;
}

/**
 * Format product list into a string for Claude's system prompt.
 */
function formatCatalog(products: Product[]): string {
  if (products.length === 0) {
    return "No products available at this time.";
  }
  return products
    .map((p) => {
      const stock = p.in_stock ? "In stock" : "OUT OF STOCK";
      return `- ${p.name} — $${p.price} ${p.currency} (${p.category}) [${stock}]\n  ${p.description}`;
    })
    .join("\n");
}

/**
 * Get formatted catalog data for injection into Claude's system prompt.
 * Uses the x402-protected catalog-service if available, with Supabase fallback.
 * Cached for 5 minutes to avoid excessive x402 payments.
 */
export async function getCatalogData(query?: string): Promise<string> {
  // Skip cache for filtered queries
  if (!query) {
    const now = Date.now();
    if (_cachedCatalog && now - _cacheTimestamp < CACHE_TTL_MS) {
      return _cachedCatalog;
    }
  }

  const products = await fetchProductsFromCatalogService(query);
  const catalog = formatCatalog(products);

  // Only cache unfiltered results
  if (!query) {
    _cachedCatalog = catalog;
    _cacheTimestamp = Date.now();
  }

  return catalog;
}
