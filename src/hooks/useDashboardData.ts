import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchTotalRevenue,
  fetchMonthlyRevenue,
  fetchTopProducts,
  fetchCategoryDistribution,
  type MonthlyRevenue,
  type TopProduct,
  type CategorySlice,
} from "@/lib/api";

export type DashboardData = {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  topProducts: TopProduct[];
  categories: CategorySlice[];
  loading: boolean;
  error: string | null;
};

export function useDashboardData(): DashboardData {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categories, setCategories] = useState<CategorySlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rev, monthly, products, cats] = await Promise.all([
        fetchTotalRevenue(),
        fetchMonthlyRevenue(),
        fetchTopProducts(),
        fetchCategoryDistribution(),
      ]);
      setTotalRevenue(rev);
      setMonthlyRevenue(monthly);
      setTopProducts(products);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_sales" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "online_sales" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { totalRevenue, monthlyRevenue, topProducts, categories, loading, error };
}
