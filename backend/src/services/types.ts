export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_url: string | null;
  in_stock: boolean;
}

export interface Transaction {
  id: string;
  business_id: string;
  conversation_id: string | null;
  service: string;
  endpoint: string;
  amount_usdc: number;
  stellar_tx_hash: string;
  status: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  telegram_chat_id: number;
  customer_name: string | null;
  created_at: string;
  last_message_at: string;
  message_count: number;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}
