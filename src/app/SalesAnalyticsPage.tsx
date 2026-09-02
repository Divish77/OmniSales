import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Loader2, TrendingUp, TrendingDown, Globe, Store,
  Zap, AlertTriangle, BarChart2, Activity, MapPin, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  fetchChannelRevenue, fetchCategoryPerformance, fetchChannelTrend,
  fetchSalesKPIs, fetchMomGrowth, fetchTopRegions, fetchAnalyticsInsights,
  type ChannelRevenue, type CategoryPerformance, type ChannelTrend,
  type SalesKPI, type MomGrowth, type TopRegion, type AnalyticsInsight,
} from "@/lib/api";
import { ChannelTrendChart } from "@/components/dashboard/ChannelTrendChart";
import { useCurrency } from "@/context/CurrencyContext";
import { useGlobalFilters } from "@/context/FilterContext";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

// ── Palette ───────────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Electronics: "#4f46e5", Furniture: "#8b5cf6", Clothing: "#ec4899",
  Accessories: "#f59e0b", "Home Appliances": "#06b6d4", Automotive: "#f43f5e",
  Books: "#10b981", "Fashion & Apparel": "#a855f7", Groceries: "#84cc16",
  "Health & Beauty": "#f97316", "Home & Kitchen": "#14b8a6",
  "Industrial & Tools": "#64748b", "Jewelry & Watches": "#eab308",
  "Office Supplies": "#3b82f6", "Pet Supplies": "#d97706",
  "Sports & Outdoors": "#0ea5e9", "Toys & Games": "#e879f9",
};
function catColor(cat: string) {
  return CAT_COLORS[cat] ?? "#6366f1";
}

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEV_STYLES: Record<string, { bg: string; text: string; icon: typeof Zap }> = {
  positive: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", icon: TrendingUp },
  negative: { bg: "bg-rose-50 dark:bg-rose-500/10",       text: "text-rose-700 dark:text-rose-400",       icon: TrendingDown },
  warning:  { bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-700 dark:text-amber-400",     icon: AlertTriangle },
  info:     { bg: "bg-indigo-50 dark:bg-indigo-500/10",   text: "text-indigo-700 dark:text-indigo-400",   icon: Activity },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ kpi, format }: { kpi: SalesKPI; format: (n: number, short?: boolean) => string }) {
  const isRev    = kpi.metric.includes("revenue");
  const isMoM    = kpi.metric === "mom_growth_pct";
  const positive = (kpi.value ?? 0) >= 0;
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{kpi.label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white">
          {isMoM
            ? <span className={positive ? "text-emerald-600" : "text-rose-500"}>{positive ? "+" : ""}{kpi.value?.toFixed(1)}%</span>
            : isRev
              ? format(kpi.value, true)
              : kpi.value?.toLocaleString()}
        </p>
        {isMoM && (
          <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-rose-500"}`}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightBadge({ insight }: { insight: AnalyticsInsight }) {
  const sev = SEV_STYLES[insight.severity] ?? SEV_STYLES.info;
  const Icon = sev.icon;
  const details = typeof insight.details === "string" ? JSON.parse(insight.details) : insight.details;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-3.5 flex items-start gap-3 ${sev.bg}`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${sev.text}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold leading-snug ${sev.text}`}>{insight.title}</p>
        {details?.interpretation && (
          <p className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">{details.interpretation}</p>
        )}
      </div>
      {insight.metric_delta != null && (
        <span className={`ml-auto flex-shrink-0 text-xs font-bold ${sev.text}`}>
          {insight.metric_key.includes("pct") || insight.metric_key.includes("growth") || insight.metric_key.includes("slope")
            ? `${insight.metric_delta > 0 ? "+" : ""}${insight.metric_delta.toFixed(1)}%`
            : insight.metric_delta.toFixed(2)}
        </span>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function SalesAnalyticsPage() {
  const { format } = useCurrency();
  const { selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate } = useGlobalFilters();
  const [channels,   setChannels]   = useState<ChannelRevenue[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [trend,      setTrend]      = useState<ChannelTrend[]>([]);
  const [kpis,       setKpis]       = useState<SalesKPI[]>([]);
  const [growth,     setGrowth]     = useState<MomGrowth[]>([]);
  const [regions,    setRegions]    = useState<TopRegion[]>([]);
  const [insights,   setInsights]   = useState<AnalyticsInsight[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchChannelRevenue(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchCategoryPerformance(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchChannelTrend(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchSalesKPIs(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchMomGrowth(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchTopRegions(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchAnalyticsInsights(selectedCountry, selectedState, selectedProduct, selectedCategory),
    ])
    .then(([ch, cat, tr, k, g, r, ins]) => {
      setChannels(ch); setCategories(cat); setTrend(tr);
      setKpis(k); setGrowth(g); setRegions(r); setInsights(ins);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate]);

  const totalRevenue = channels.reduce((s, c) => s + Number(c.revenue), 0);
  const maxCatRev    = categories[0] ? Number(categories[0].revenue) : 1;
  const maxRegRev    = regions[0] ? Number(regions[0].revenue) : 1;

  // Group insights by type for display
  const aiInsights  = insights.filter(i => ["surge", "pullback", "stable", "trend", "anomaly", "correlation"].includes(i.insight_type));
  const growthData  = growth.slice(0, 8).map(g => ({
    category: g.category?.length > 12 ? g.category.slice(0, 12) + "…" : g.category,
    fullName: g.category,
    growth: g.growth_pct != null ? Number(g.growth_pct) : 0,
    revenue: Number(g.current_month_revenue),
  }));

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sales Analytics
          {selectedMonth && (
            <span className="ml-3 text-lg font-medium text-indigo-500 dark:text-indigo-400">
              — {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          )}
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          {selectedMonth
            ? `Showing historical report for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`
            : 'AI-powered performance metrics — driven by Python ML analysis of your live data.'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="w-full relative z-[60]"
      >
        <DashboardFilters />
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {loading
          ? [0,1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)
          : kpis.map(k => <KpiCard key={k.metric} kpi={k} format={format} />)
        }
      </motion.div>

      {/* Revenue Trend + AI Insights */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">

        {/* Area chart — 2/3 width */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2"
        >
          <ChannelTrendChart data={trend} loading={loading} />
        </motion.div>

        {/* AI Insights panel — 1/3 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Real-time native database telemetry mappings.
              </p>
            </CardHeader>
            <CardContent className="pt-1">
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
            ) : aiInsights.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Intelligence Mapping Computed</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                      Upload transactional logic or process sales data to automatically trigger the backend trajectory mapping engines.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {aiInsights.map(ins => <InsightBadge key={ins.id} insight={ins} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Channel Splits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2"
      >
        {loading
          ? [0,1].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)
          : channels.map((ch, i) => (
            <motion.div key={ch.channel} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
              <Card className="glass-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${ch.channel === "online" ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-purple-50 dark:bg-purple-500/10"}`}>
                    {ch.channel === "online"
                      ? <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      : <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 capitalize font-medium">{ch.channel} Channel</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{format(Number(ch.revenue), true)}</p>
                    <p className="text-xs text-slate-400">{ch.orders.toLocaleString()} orders · avg {format(Number(ch.avg_order_value))}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {totalRevenue > 0 ? ((Number(ch.revenue) / totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-slate-400">of total</p>
                    {/* Mini bar */}
                    <div className="mt-1 w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalRevenue > 0 ? (Number(ch.revenue)/totalRevenue)*100 : 0}%`,
                          background: ch.channel === "online" ? "#4f46e5" : "#9333ea",
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        }
      </motion.div>

      {/* MoM Growth Bar Chart + Category Performance */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">

        {/* MoM Growth by Category */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Month-over-Month Growth by Category</CardTitle>
              <p className="text-xs text-slate-400">Current month vs previous month revenue change</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthData} margin={{ top: 4, right: 12, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                      <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", opacity: 0.6, fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", opacity: 0.6, fontSize: 11 }}
                        tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--background)", borderRadius: "12px", border: "1px solid var(--border)" }}
                        formatter={(v: any, _: any, props: any) => [`${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(1)}%`, props.payload.fullName]}
                      />
                      <Bar dataKey="growth" radius={[4,4,0,0]}>
                        {growthData.map((entry, i) => (
                          <Cell key={i} fill={entry.growth >= 0 ? "#10b981" : "#f43f5e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Category Performance</CardTitle>
              <p className="text-xs text-slate-400">Total revenue with channel split breakdown</p>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="h-60 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                : (
                  <div className="space-y-3">
                    {categories.map((cat) => {
                      const pct = Math.min(100, (Number(cat.revenue) / maxCatRev) * 100);
                      const color = catColor(cat.category);
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <div className="w-24 text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{cat.category}</div>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                            />
                          </div>
                          <div className="text-right w-24 flex-shrink-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{format(Number(cat.revenue), true)}</p>
                            <p className="text-[10px] text-slate-400">{cat.channel_split}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Regions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <CardTitle className="text-base font-semibold">Top Regions by Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {regions.map((r, i) => {
                  const pct = Math.max(4, (Number(r.revenue) / maxRegRev) * 100);
                  return (
                    <motion.div
                      key={`${r.country}-${r.region}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{r.region || r.country}</p>
                          <p className="text-[10px] text-slate-400">{r.country} · {Number(r.orders).toLocaleString()} orders</p>
                        </div>
                        <span className="ml-2 flex-shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">{format(Number(r.revenue), true)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.04, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
