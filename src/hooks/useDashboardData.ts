import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchTotalRevenue,
  fetchMonthlyRevenue,
  fetchCategoryDistribution,
  fetchChannelRevenue,
  fetchTopProducts,
  type MonthlyRevenue,
  type CategorySlice,
  type ChannelRevenue,
  type TopProduct,
} from "@/lib/api";

export type DashboardData = {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  categories: CategorySlice[];
  channelRevenue: ChannelRevenue[];
  topProducts: TopProduct[];
  totalOrders: number;
  loading: boolean;
  error: string | null;
};

export function useDashboardData(
  country?: string,
  region?: string,
  product?: string,
  category?: string,
  startDate?: string,
  endDate?: string,
): DashboardData {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [categories, setCategories] = useState<CategorySlice[]>([]);
  const [channelRevenue, setChannelRevenue] = useState<ChannelRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rev, monthly, cats, channels, products] = await Promise.all([
        fetchTotalRevenue(country, region, product, category, startDate, endDate),
        fetchMonthlyRevenue(country, region, product, category, startDate, endDate),
        fetchCategoryDistribution(country, region, product, category, startDate, endDate),
        fetchChannelRevenue(country, region, product, category, undefined, startDate, endDate),
        fetchTopProducts(country, region, product, category, startDate, endDate),
      ]);
      setTotalRevenue(rev);
      setMonthlyRevenue(monthly);
      setCategories(cats);
      setChannelRevenue(channels);
      setTopProducts(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [country, region, product, category, startDate, endDate]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_sales" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "online_sales" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const totalOrders = channelRevenue.reduce((sum, ch) => sum + (Number(ch.orders) || 0), 0);

  return { totalRevenue, monthlyRevenue, categories, channelRevenue, topProducts, totalOrders, loading, error };
}
