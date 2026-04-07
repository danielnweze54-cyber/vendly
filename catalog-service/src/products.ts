import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { env } from "./config/env.js";
import type { Product } from "./types.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const products = new Hono();

// GET /api/products — list all products (optionally filter by query)
products.get("/", async (c) => {
  const query = c.req.query("q");
  const category = c.req.query("category");

  let request = supabase
    .from("products")
    .select("*")
    .eq("in_stock", true)
    .order("name");

  if (category) {
    request = request.eq("category", category);
  }

  const { data, error } = await request;

  if (error) {
    return c.json({ error: "Failed to fetch products" }, 500);
  }

  let results: Product[] = data ?? [];

  // Simple text search filter if query provided
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }

  return c.json({
    products: results,
    count: results.length,
    query: query ?? null,
  });
});

// GET /api/products/:id — get a single product
products.get("/:id", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return c.json({ error: "Product not found" }, 404);
  }

  return c.json({ product: data });
});

export { products };
