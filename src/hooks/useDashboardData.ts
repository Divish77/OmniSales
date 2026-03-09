import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchTotalRevenue,
  fetchMonthlyRevenue,
  fetchTopProducts,
  fetchCategoryDistribution,
  fetchRegionalDemand,
  fetchChannelRevenue,
  type MonthlyRevenue,
  type TopProduct,
  type CategorySlice,
  type RegionalDemand,
  type ChannelRevenue,
} from "@/lib/api";

export type DashboardData = {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  topProducts: TopProduct[];
  categories: CategorySlice[];
  regionalDemand: RegionalDemand[];
  channelRevenue: ChannelRevenue[];
  totalOrders: number;
  loading: boolean;
  error: string | null;
};

export function useDashboardData(): DashboardData {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categories, setCategories] = useState<CategorySlice[]>([]);
  const [regionalDemand, setRegionalDemand] = useState<RegionalDemand[]>([]);
  const [channelRevenue, setChannelRevenue] = useState<ChannelRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rev, monthly, products, cats, regional, channels] = await Promise.all([
        fetchTotalRevenue(),
        fetchMonthlyRevenue(),
        fetchTopProducts(),
        fetchCategoryDistribution(),
        fetchRegionalDemand(),
        fetchChannelRevenue()
      ]);
      setTotalRevenue(rev);
      setMonthlyRevenue(monthly);
      setTopProducts(products);
      setCategories(cats);
      setRegionalDemand(regional);
      setChannelRevenue(channels);
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

  const totalOrders = channelRevenue.reduce((sum, channel) => sum + channel.orders, 0);

  return { totalRevenue, monthlyRevenue, topProducts, categories, regionalDemand, channelRevenue, totalOrders, loading, error };
}
