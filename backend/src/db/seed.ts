import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_PRODUCTS = [
  {
    name: "Nike Air Max 90",
    description: "Zapatillas clásicas Nike Air Max 90 en blanco y negro. Cómodas para uso diario.",
    price: 89.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Nike+Air+Max+90",
    in_stock: true,
  },
  {
    name: "Adidas Ultraboost 22",
    description: "Zapatillas de running Adidas Ultraboost con tecnología Boost. Ideales para correr.",
    price: 119.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Adidas+Ultraboost",
    in_stock: true,
  },
  {
    name: "Puma Suede Classic",
    description: "Zapatillas retro Puma Suede en azul marino. Estilo casual urbano.",
    price: 64.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Puma+Suede",
    in_stock: true,
  },
  {
    name: "New Balance 574",
    description: "Zapatillas New Balance 574 en gris. Confort y estilo clásico.",
    price: 79.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=NB+574",
    in_stock: true,
  },
  {
    name: "Converse Chuck Taylor All Star",
    description: "Las clásicas Converse en lona negra. Un ícono del streetwear.",
    price: 54.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Converse+Chuck",
    in_stock: true,
  },
  {
    name: "Reebok Classic Leather",
    description: "Zapatillas Reebok de cuero blanco. Elegantes y versátiles.",
    price: 69.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Reebok+Classic",
    in_stock: false,
  },
  {
    name: "Vans Old Skool",
    description: "Zapatillas Vans Old Skool en negro con franja blanca. Estilo skate.",
    price: 59.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Vans+Old+Skool",
    in_stock: true,
  },
  {
    name: "Nike Dunk Low",
    description: "Nike Dunk Low en panda (blanco y negro). El modelo más popular del momento.",
    price: 109.99,
    currency: "USD",
    category: "zapatillas",
    image_url: "https://placehold.co/400x300?text=Nike+Dunk+Low",
    in_stock: true,
  },
];

async function seed() {
  console.log("Seeding demo data...\n");

  // 1. Upsert demo business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .upsert(
      {
        name: "Demo Zapatería",
        telegram_bot_token: "SET_VIA_ENV",
        stellar_public_key: "SET_VIA_ENV",
      },
      { onConflict: "name" }
    )
    .select()
    .single();

  if (bizError) {
    console.error("Failed to create business:", bizError.message);
    process.exit(1);
  }

  console.log(`Business: ${business.name} (${business.id})`);

  // 2. Insert products for the demo business
  const productsWithBiz = DEMO_PRODUCTS.map((p) => ({
    ...p,
    business_id: business.id,
  }));

  // Delete existing products for this business first (idempotent seed)
  await supabase.from("products").delete().eq("business_id", business.id);

  const { data: products, error: prodError } = await supabase
    .from("products")
    .insert(productsWithBiz)
    .select();

  if (prodError) {
    console.error("Failed to insert products:", prodError.message);
    process.exit(1);
  }

  console.log(`Inserted ${products.length} products:`);
  for (const p of products) {
    console.log(`  - ${p.name} ($${p.price}) ${p.in_stock ? "✓" : "✗ out of stock"}`);
  }

  console.log("\nSeed complete!");
  console.log(`\nDemo business ID: ${business.id}`);
  console.log("Use this ID as NEXT_PUBLIC_BUSINESS_ID in the frontend .env");
}

seed().catch(console.error);
