import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are correctly loaded from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Dashboard data connection will fail. Please create a .env file.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);

// Explicit Types matching our Schema
export type SalesRecord = {
  id: string;
  date: string;
  product_name: string;
  category: string;
  quantity: number;
  price: number;
  location: string;
  source: 'store' | 'online';
};
