import { supabase } from "@/lib/supabase";

// ── Original Dashboard RPCs (used by useDashboardData hook) ───────────────
export type MonthlyRevenue = { month: string; revenue: number };
export type CategorySlice = { name: string; value: number };
export type TopProduct = { product_name: string; category: string; revenue: number; units_sold: number };

export async function fetchTotalRevenue(
  country?: string, region?: string, product?: string, category?: string,
  startDate?: string, endDate?: string
): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_revenue", {
    p_country:    country    || null,
    p_region:     region     || null,
    p_product:    product    || null,
    p_category:   category   || null,
    p_start_date: startDate  || null,
    p_end_date:   endDate    || null,
  });
  if (error) throw new Error(error.message);
  return Number(data) ?? 0;
}

export async function fetchMonthlyRevenue(
  country?: string, region?: string, product?: string, category?: string,
  startDate?: string, endDate?: string
): Promise<MonthlyRevenue[]> {
  const { data, error } = await supabase.rpc("get_monthly_sales", {
    p_country:    country    || null,
    p_region:     region     || null,
    p_product:    product    || null,
    p_category:   category   || null,
    p_start_date: startDate  || null,
    p_end_date:   endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as MonthlyRevenue[]) ?? [];
}

export async function fetchCategoryDistribution(
  country?: string, region?: string, product?: string, category?: string,
  startDate?: string, endDate?: string
): Promise<CategorySlice[]> {
  const { data, error } = await supabase.rpc("get_category_distribution", {
    p_country:    country    || null,
    p_region:     region     || null,
    p_product:    product    || null,
    p_category:   category   || null,
    p_start_date: startDate  || null,
    p_end_date:   endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as CategorySlice[]) ?? [];
}

export async function fetchTopProducts(
  country?: string, region?: string, product?: string, category?: string,
  startDate?: string, endDate?: string
): Promise<TopProduct[]> {
  const { data, error } = await supabase.rpc("get_top_products", {
    p_country:    country    || null,
    p_region:     region     || null,
    p_product:    product    || null,
    p_category:   category   || null,
    p_limit:      6,
    p_start_date: startDate  || null,
    p_end_date:   endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as TopProduct[]) ?? [];
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ChannelRevenue = { channel: string; revenue: number; orders: number; avg_order_value: number };
export type CategoryPerformance = { category: string; revenue: number; units_sold: number; channel_split: string };
export type ChannelTrend = { month: string; online_revenue: number; store_revenue: number };
export type RepeatProduct = { product_name: string; category: string; total_units: number; avg_quantity: number; channels: string };
export type Forecast = {
  forecast_month: string;
  category: string;
  predicted_revenue: number;
  predicted_quantity: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
  insight_label: string;
  region: string;
  top_product: string;
};
export type Recommendation = { id: string; title: string; recommendation: string; category: string; channel: string; region: string; impact_level: "high" | "medium" | "low"; metric_value: number; created_at: string };
export type AnalyticsInsight = { id: string; insight_type: string; title: string; metric_key: string; metric_value: number; metric_delta: number | null; details: Record<string, any>; severity: string; computed_at: string };
export type SalesKPI = { metric: string; value: number; label: string };
export type MomGrowth = { category: string; current_month_revenue: number; prev_month_revenue: number; growth_pct: number | null };
export type TopRegion = { country: string; region: string; revenue: number; orders: number };
export type StrategicBriefing = {
  recommendations: Recommendation[];
  signals: { insight_type: string; label: string; category: string; value: number }[];
  top_growth_opportunity: { category: string; potential_gain: number };
  generated_at: string;
};

export type AIInsight = {
  id: string;
  insight_type: 'anomaly' | 'trend_acceleration' | 'trend_cooling' | 'seasonality' | 'risk' | 'regional_delta';
  category: string | null;
  product_name: string | null;
  country: string | null;
  state: string | null;
  impact_level: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  metric_value: number | null;
  metric_label: string | null;
  generated_at: string;
  insight_month: string | null;
};

// ── AI Insights V2 (Self-Trained ML Engine) ────────────────────────────────
export async function fetchAIInsightsV2(params: {
  country?: string;
  state?: string;
  product?: string;
  category?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AIInsight[]> {
  const { data, error } = await supabase.rpc("get_ai_insights_v2", {
    p_country:  params.country   || null,
    p_state:    params.state     || null,
    p_product:  params.product   || null,
    p_category: params.category  || null,
    p_month:    params.month     || null,
  });
  if (error) throw new Error(error.message);

  let results = (data as AIInsight[]) ?? [];

  // Client-side date filtering for insights if backend doesn't support date range
  if (params.startDate || params.endDate) {
    results = results.filter(insight => {
      const insightDate = insight.insight_month
        ? insight.insight_month + '-01'
        : insight.generated_at?.substring(0, 10);
      if (!insightDate) return true;
      const d = insightDate.substring(0, 10);
      if (params.startDate && d < params.startDate.substring(0, 7) + '-01') return false;
      if (params.endDate && d > params.endDate) return false;
      return true;
    });
  }

  return results;
}


// ── Agent 2: Sales Analytics ───────────────────────────────────────────────
export async function fetchChannelRevenue(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<ChannelRevenue[]> {
  const { data, error } = await supabase.rpc("get_channel_revenue", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as ChannelRevenue[]) ?? [];
}

export async function fetchCategoryPerformance(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<CategoryPerformance[]> {
  const { data, error } = await supabase.rpc("get_category_performance", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as CategoryPerformance[]) ?? [];
}

// ── Agent 3: Customer Behavior ─────────────────────────────────────────────

export async function fetchChannelTrend(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<ChannelTrend[]> {
  const { data, error } = await supabase.rpc("get_channel_trend", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as ChannelTrend[]) ?? [];
}

export async function fetchRepeatProducts(
  country?: string, region?: string, product?: string, category?: string
): Promise<RepeatProduct[]> {
  const { data, error } = await supabase.rpc("get_repeat_products", {
    p_country:  country   || null,
    p_region:   region    || null,
    p_product:  product   || null,
    p_category: category  || null,
  });
  if (error) throw new Error(error.message);
  return (data as RepeatProduct[]) ?? [];
}

// ── Agent 4: Forecasts ─────────────────────────────────────────────────────
export async function fetchForecasts(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<Forecast[]> {
  const { data, error } = await supabase.rpc("get_forecasts_v2", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as Forecast[]) ?? [];
}

// ── Agent 5: Recommendations ───────────────────────────────────────────────
export async function fetchRecommendations(
  country?: string, region?: string, product?: string, category?: string
): Promise<Recommendation[]> {
  const { data, error } = await supabase.rpc("get_ai_recommendations", {
    p_country:  country   || null,
    p_region:   region    || null,
    p_product:  product   || null,
    p_category: category  || null,
  });
  if (error) throw new Error(error.message);
  return (data as Recommendation[]) ?? [];
}

export async function fetchStrategicBriefing(
  country?: string, region?: string, product?: string, category?: string, month?: string
): Promise<StrategicBriefing> {
  const { data, error } = await supabase.rpc("get_strategic_briefing", {
    p_country:      country   || null,
    p_region:       region    || null,
    p_product:      product   || null,
    p_category:     category  || null,
    p_target_month: month     || null,
  });
  if (error) throw new Error(error.message);
  return (data as StrategicBriefing);
}

// ── Analytics Engine (AI Insights) ────────────────────────────────────────────
export async function fetchAnalyticsInsights(
  country?: string, region?: string, product?: string, category?: string
): Promise<AnalyticsInsight[]> {
  const { data, error } = await supabase.rpc("get_analytics_insights", {
    p_country:  country   || null,
    p_region:   region    || null,
    p_product:  product   || null,
    p_category: category  || null,
  });
  if (error) throw new Error(error.message);
  return (data as AnalyticsInsight[]) ?? [];
}

export async function fetchSalesKPIs(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<SalesKPI[]> {
  const { data, error } = await supabase.rpc("get_sales_kpis", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as SalesKPI[]) ?? [];
}

export async function fetchMomGrowth(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<MomGrowth[]> {
  const { data, error } = await supabase.rpc("get_mom_growth", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as MomGrowth[]) ?? [];
}

export async function fetchTopRegions(
  country?: string, region?: string, product?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<TopRegion[]> {
  const { data, error } = await supabase.rpc("get_top_regions", {
    p_limit:        8,
    p_country:      country    || null,
    p_region:       region     || null,
    p_product:      product    || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as TopRegion[]) ?? [];
}

// ── Customer Behavior ──────────────────────────────────────────────────────────
export type CustomerBehaviorRow = {
  id: string;
  insight_type: string;
  channel: string | null;
  region: string | null;
  category: string | null;
  product_name: string | null;
  value: number;
  label: string;
  run_at: string;
};

export type BasketAnalysis = {
  category: string;
  channel: string;
  avg_basket_value: number;
  avg_units: number;
  total_transactions: number;
};

export type LoyaltySignal = {
  product_name: string;
  category: string;
  total_units: number;
  total_orders: number;
  avg_quantity: number;
  channels: string;
};

export type ChannelKPI = {
  channel: string;
  revenue: number;
  orders: number;
  share_pct: number;
  avg_basket: number;
};

export async function fetchCustomerBehavior(
  country?: string, region?: string, category?: string, product?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<CustomerBehaviorRow[]> {
  const { data, error } = await supabase.rpc("get_dynamic_ml_insights", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_category:     category   || null,
    p_product:      product    || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as CustomerBehaviorRow[]) ?? [];
}

export async function fetchBasketAnalysis(
  country?: string, region?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<BasketAnalysis[]> {
  const { data, error } = await supabase.rpc("get_basket_analysis", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as BasketAnalysis[]) ?? [];
}

export async function fetchLoyaltySignals(
  country?: string, region?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<LoyaltySignal[]> {
  const { data, error } = await supabase.rpc("get_loyalty_signals", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as LoyaltySignal[]) ?? [];
}

export async function fetchChannelKPIs(
  country?: string, region?: string, category?: string, month?: string,
  startDate?: string, endDate?: string
): Promise<ChannelKPI[]> {
  const { data, error } = await supabase.rpc("get_channel_kpis", {
    p_country:      country    || null,
    p_region:       region     || null,
    p_category:     category   || null,
    p_target_month: month      || null,
    p_start_date:   startDate  || null,
    p_end_date:     endDate    || null,
  });
  if (error) throw new Error(error.message);
  return (data as ChannelKPI[]) ?? [];
}
