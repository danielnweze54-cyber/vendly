export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  image_url: string | null;
  in_stock: boolean;
}
