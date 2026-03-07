import { supabase } from "@/lib/supabase";

// ── Original Dashboard RPCs (used by useDashboardData hook) ───────────────
export type MonthlyRevenue = { month: string; revenue: number };
export type TopProduct = { name: string; category: string; sales: number };
export type CategorySlice = { name: string; value: number };

export async function fetchTotalRevenue(): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_revenue");
  if (error) throw new Error(error.message);
  return Number(data) ?? 0;
}

export async function fetchMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const { data, error } = await supabase.rpc("get_monthly_sales");
  if (error) throw new Error(error.message);
  return (data as MonthlyRevenue[]) ?? [];
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  const { data, error } = await supabase.rpc("get_top_products");
  if (error) throw new Error(error.message);
  return (data as TopProduct[]) ?? [];
}

export async function fetchCategoryDistribution(): Promise<CategorySlice[]> {
  const { data, error } = await supabase.rpc("get_category_distribution");
  if (error) throw new Error(error.message);
  return (data as CategorySlice[]) ?? [];
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ChannelRevenue = { channel: string; revenue: number; orders: number; avg_order_value: number };
export type CategoryPerformance = { category: string; revenue: number; units_sold: number; channel_split: string };
export type RegionalDemand = { region: string; revenue: number; units_sold: number; top_category: string };
export type ChannelPreference = { region: string; online_pct: number; store_pct: number; dominant_channel: string };
export type ChannelTrend = { month: string; online_revenue: number; store_revenue: number };
export type RepeatProduct = { product_name: string; category: string; total_units: number; avg_quantity: number; channels: string };
export type Forecast = { forecast_month: string; category: string; predicted_revenue: number; predicted_quantity: number; confidence: number };
export type Recommendation = { id: string; title: string; recommendation: string; category: string; channel: string; region: string; impact_level: "high" | "medium" | "low"; metric_value: number; created_at: string };

// ── Agent 2: Sales Analytics ───────────────────────────────────────────────
export async function fetchChannelRevenue(): Promise<ChannelRevenue[]> {
  const { data, error } = await supabase.rpc("get_channel_revenue");
  if (error) throw new Error(error.message);
  return (data as ChannelRevenue[]) ?? [];
}

export async function fetchCategoryPerformance(): Promise<CategoryPerformance[]> {
  const { data, error } = await supabase.rpc("get_category_performance");
  if (error) throw new Error(error.message);
  return (data as CategoryPerformance[]) ?? [];
}

export async function fetchRegionalDemand(): Promise<RegionalDemand[]> {
  const { data, error } = await supabase.rpc("get_regional_demand");
  if (error) throw new Error(error.message);
  return (data as RegionalDemand[]) ?? [];
}

// ── Agent 3: Customer Behavior ─────────────────────────────────────────────
export async function fetchChannelPreference(): Promise<ChannelPreference[]> {
  const { data, error } = await supabase.rpc("get_channel_preference");
  if (error) throw new Error(error.message);
  return (data as ChannelPreference[]) ?? [];
}

export async function fetchChannelTrend(): Promise<ChannelTrend[]> {
  const { data, error } = await supabase.rpc("get_channel_trend");
  if (error) throw new Error(error.message);
  return (data as ChannelTrend[]) ?? [];
}

export async function fetchRepeatProducts(): Promise<RepeatProduct[]> {
  const { data, error } = await supabase.rpc("get_repeat_products");
  if (error) throw new Error(error.message);
  return (data as RepeatProduct[]) ?? [];
}

// ── Agent 4: Forecasts ─────────────────────────────────────────────────────
export async function fetchForecasts(): Promise<Forecast[]> {
  const { data, error } = await supabase.rpc("get_forecasts");
  if (error) throw new Error(error.message);
  return (data as Forecast[]) ?? [];
}

// ── Agent 5: Recommendations ───────────────────────────────────────────────
export async function fetchRecommendations(): Promise<Recommendation[]> {
  const { data, error } = await supabase.rpc("get_ai_recommendations");
  if (error) throw new Error(error.message);
  return (data as Recommendation[]) ?? [];
}
