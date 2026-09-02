import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Loader2, ShoppingBag, Repeat2, TrendingUp, TrendingDown,
  Zap, Star, AlertTriangle, Activity, Store, Wifi,
  BarChart2, Users, ArrowUpRight, ArrowDownRight, Brain,
} from "lucide-react";
import {
  fetchChannelTrend, fetchChannelKPIs, fetchLoyaltySignals, fetchBasketAnalysis,
  fetchCustomerBehavior,
  type ChannelTrend, type ChannelKPI, type LoyaltySignal,
  type BasketAnalysis, type CustomerBehaviorRow,
} from "@/lib/api";
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
  Sports: "#22c55e", Toys: "#f472b6",
};
const pickColor = (cat: string) => CAT_COLORS[cat] ?? "#6366f1";

const INSIGHT_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  churn_signal:    { icon: TrendingDown,  color: "text-red-400",    bg: "bg-red-500/10",    label: "Churn Risk" },
  margin_risk:     { icon: Star,          color: "text-rose-500",   bg: "bg-rose-500/10",   label: "Margin Risk" },
  cannibalization_risk:{ icon: Repeat2,   color: "text-orange-400", bg: "bg-orange-500/10", label: "Cannibalization" },
  seasonal_peak:   { icon: Activity,      color: "text-amber-400",  bg: "bg-amber-500/10",  label: "Seasonal Peak" },
  channel_shift:   { icon: TrendingUp,    color: "text-indigo-400", bg: "bg-indigo-500/10", label: "Channel Shift" },
  price_sensitivity:{ icon: Zap,          color: "text-purple-400", bg: "bg-purple-500/10", label: "Price Signal" },
  product_affinity:{ icon: Brain,         color: "text-cyan-400",   bg: "bg-cyan-500/10",   label: "Affinity" },
  loyalty_product: { icon: Star,          color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Loyalty" },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color, delay = 0, trend
}: {
  icon: any; label: string; value: string; sub?: string;
  color: string; delay?: number; trend?: "up" | "down" | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-5 shadow-lg"
    >
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-15`}>
          <Icon className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
        </div>
        {trend && (
          trend === "up"
            ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            : <ArrowDownRight className="w-4 h-4 text-red-400" />
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Insight Badge ─────────────────────────────────────────────────────────────
function InsightBadge({ row }: { row: CustomerBehaviorRow }) {
  const meta = INSIGHT_META[row.insight_type] ?? {
    icon: Activity, color: "text-slate-400", bg: "bg-slate-500/10", label: row.insight_type
  };
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl ${meta.bg} border border-white/5`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${meta.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
          {row.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-medium">{row.category}</span>
          )}
          {row.region && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-medium">{row.region}</span>
          )}
        </div>
        <p className="text-[11px] mt-1.5 text-slate-500 dark:text-slate-400 leading-relaxed text-justify">{row.label}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-auto pt-0.5">
        <span className={`text-xs font-bold ${meta.color}`}>
          {Math.abs(row.value) > 1000 ? `${(row.value / 1000).toFixed(1)}K` : row.value.toFixed(1)}
        </span>
        {row.label.toLowerCase().includes('price') && <Zap className="w-3 h-3 text-purple-400 opacity-60" />}
        {row.label.toLowerCase().includes('online') && <Wifi className="w-3 h-3 text-indigo-400 opacity-60" />}
      </div>
    </motion.div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md text-xs">
      <p className="font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {format ? format(p.value, true) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function CustomerBehaviorPage() {
  const { format } = useCurrency();
  const { selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate } = useGlobalFilters();

  const [channelKPIs,   setChannelKPIs]   = useState<ChannelKPI[]>([]);
  const [trend,          setTrend]          = useState<ChannelTrend[]>([]);
  const [loyalty,        setLoyalty]        = useState<LoyaltySignal[]>([]);
  const [basket,         setBasket]         = useState<BasketAnalysis[]>([]);
  const [mlInsights,     setMlInsights]     = useState<CustomerBehaviorRow[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchChannelKPIs(selectedCountry, selectedState, selectedCategory, selectedMonth, startDate, endDate),
      fetchChannelTrend(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchLoyaltySignals(selectedCountry, selectedState, selectedCategory, selectedMonth, startDate, endDate),
      fetchBasketAnalysis(selectedCountry, selectedState, selectedCategory, selectedMonth, startDate, endDate),
      fetchCustomerBehavior(selectedCountry, selectedState, selectedCategory, selectedProduct, selectedMonth, startDate, endDate),
    ])
      .then(([ck, tr, ly, ba, ml]) => {
        setChannelKPIs(ck);
        setTrend(tr);
        setLoyalty(ly);
        setBasket(ba);
        setMlInsights(ml);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate]);

  // ── Derived KPIs ─────────────────────────────────────────────────────────────
  const online = channelKPIs.find(c => c.channel === "online");
  const onlineShare = online?.share_pct ?? 0;
  const avgBasket   = channelKPIs.reduce((s, c) => s + Number(c.avg_basket), 0) / (channelKPIs.length || 1);
  const totalOrders = channelKPIs.reduce((s, c) => s + Number(c.orders), 0);
  const loyaltyRate = loyalty.length > 0 ? loyalty[0].avg_quantity : 0;

  // Basket chart data — top categories, both channels
  const basketByCategory = basket.reduce<Record<string, { category: string; online: number; store: number }>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = { category: b.category, online: 0, store: 0 };
    acc[b.category][b.channel as "online" | "store"] = Number(b.avg_basket_value);
    return acc;
  }, {});
  const basketData = Object.values(basketByCategory)
    .sort((a, b) => (b.online + b.store) - (a.online + a.store))
    .slice(0, 8);

  // Filter ml insights for display categories
  const churnItems   = mlInsights.filter(r => r.insight_type === "churn_signal").slice(0, 4);
  const marginItems  = mlInsights.filter(r => r.insight_type === "margin_risk").slice(0, 3);
  const canniItems   = mlInsights.filter(r => r.insight_type === "cannibalization_risk").slice(0, 3);
  const shiftItems   = mlInsights.filter(r => r.insight_type === "channel_shift").slice(0, 3);
  const affItems     = mlInsights.filter(r => r.insight_type === "product_affinity").slice(0, 4);
  const priceItems   = mlInsights.filter(r => r.insight_type === "price_sensitivity").slice(0, 3);
  const peakItems    = mlInsights.filter(r => r.insight_type === "seasonal_peak").slice(0, 3);
  const allMlFeed    = [...churnItems, ...marginItems, ...canniItems, ...shiftItems, ...affItems, ...priceItems, ...peakItems];

  const stagger = (i: number) => ({ delay: 0.05 + i * 0.06 });

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10">
            <Users className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customer Behavior
              {selectedMonth && (
                <span className="ml-3 text-lg font-medium text-indigo-500 dark:text-indigo-400">
                  — {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              )}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedMonth
                ? `Historical behavioral analysis for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                : 'Intelligent behavioral analysis—identifying purchase patterns, churn risks, and affinity signals.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="w-full relative z-[60]">
        <DashboardFilters />
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wifi}       label="Online Share"    value={`${onlineShare.toFixed(1)}%`}   sub={`${online?.orders ?? 0} online orders`}             color="bg-indigo-500" delay={0.1} trend={onlineShare > 50 ? "up" : "down"} />
        <StatCard icon={ShoppingBag} label="Avg Basket Value" value={format(avgBasket, true)}       sub="Per transaction"                                   color="bg-purple-500" delay={0.15} />
        <StatCard icon={Repeat2}    label="Total Orders"    value={totalOrders.toLocaleString()}    sub={`${channelKPIs.length} channels tracked`}           color="bg-cyan-500"   delay={0.2} trend="up" />
        <StatCard icon={Star}       label="Top Reorder Qty" value={`${Number(loyaltyRate).toFixed(1)} /order`} sub={loyalty[0]?.product_name ?? "N/A"}      color="bg-amber-500"  delay={0.25} />
      </div>

      {/* Channel Trend — Full Width */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3)}
        className="rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-5 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">Online vs Store — Monthly Trend</h3>
        </div>
        {loading
          ? <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
          : trend.length === 0
            ? <p className="h-64 flex items-center justify-center text-slate-400 text-sm">No trend data available. Run the analytics engine.</p>
            : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="onlineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} stroke="#94a3b8" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => format(v, true)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<ChartTooltip format={format} />} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Line type="monotone" dataKey="online_revenue" name="Online" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="store_revenue"  name="Store"  stroke="#a855f7" strokeWidth={2.5} dot={false} strokeDasharray="5 5" activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
        }
      </motion.div>

      {/* Row 3: Basket Analysis + Channel Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Basket Analysis — 3 cols */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={stagger(4)}
          className="xl:col-span-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Avg Basket Value by Category</h3>
            <span className="ml-auto text-xs text-slate-400">Online vs Store</span>
          </div>
          {loading
            ? <div className="h-60 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
            : (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={basketData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.15} />
                    <XAxis type="number" tickFormatter={(v) => format(v, true)} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip format={format} />} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="online" name="Online" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={10} />
                    <Bar dataKey="store"  name="Store"  fill="#a855f7" radius={[0, 4, 4, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </motion.div>

        {/* Channel KPI Summary — 2 cols */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={stagger(5)}
          className="xl:col-span-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Channel Breakdown</h3>
          </div>
          {loading
            ? <div className="h-60 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
            : channelKPIs.length === 0
              ? <p className="text-center text-slate-400 text-sm py-8">No channel data.</p>
              : (
                <div className="space-y-4">
                  {channelKPIs.map((c, i) => {
                    const Icon = c.channel === "online" ? Wifi : Store;
                    const color = c.channel === "online" ? "#6366f1" : "#a855f7";
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color }} />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{c.channel}</span>
                          <span className="ml-auto text-xs font-bold" style={{ color }}>{c.share_pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${c.share_pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{format(Number(c.revenue), true)} revenue</span>
                          <span>{Number(c.orders).toLocaleString()} orders</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
          }
        </motion.div>
      </div>

      {/* Row 4: Loyalty Leaderboard + ML Insights Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Loyalty Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={stagger(6)}
          className="rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Loyalty Leaderboard</h3>
            <span className="ml-auto text-xs text-slate-400">By purchase velocity</span>
          </div>
          {loading
            ? <div className="h-72 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
            : loyalty.length === 0
              ? <p className="text-center text-slate-400 text-sm py-8">No data. Run the analytics engine.</p>
              : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {loyalty.slice(0, 10).map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: pickColor(r.category) + "33", color: pickColor(r.category) }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{r.product_name}</p>
                        <p className="text-xs text-slate-400">{r.category} · {r.channels}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Number(r.total_units).toLocaleString()} <span className="text-xs font-normal">units</span></p>
                        <p className="text-xs text-slate-400">{Number(r.avg_quantity).toFixed(1)} avg/order</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
          }
        </motion.div>

        {/* ML Behavioral Insights Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={stagger(7)}
          className="rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Behavioral Intelligence</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
              AI Powered
            </span>
          </div>
          {loading
            ? <div className="h-72 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
            : allMlFeed.length === 0
              ? (
                <div className="h-72 flex flex-col items-center justify-center gap-3 text-center">
                  <Brain className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium text-slate-500">No behavioral insights detected.</p>
                  <p className="text-xs text-slate-400">Broaden your filters to see more analysis.</p>
                </div>
              )
              : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {allMlFeed.map((row) => (
                    <InsightBadge key={row.id} row={row} />
                  ))}
                </div>
              )
          }
        </motion.div>
      </div>

      {/* Row 5: Churn Risk full strip */}
      {!loading && churnItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={stagger(8)}
          className="rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-red-400">Churn Risk Signals — Attention Required</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
              {churnItems.length} categories at risk
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {churnItems.map((r, i) => {
              const hasPriceIssue = r.label.toLowerCase().includes('price');
              const hasOnlineIssue = r.label.toLowerCase().includes('online');
              return (
                <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col justify-between group hover:bg-red-500/10 transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-sm font-semibold text-red-400">{r.category}</p>
                       <div className="flex gap-1.5">
                         {hasPriceIssue && <div className="p-1 rounded bg-purple-500/10" title="Price Sensitivity Issue"><Zap className="w-3 h-3 text-purple-400" /></div>}
                         {hasOnlineIssue && <div className="p-1 rounded bg-indigo-500/10" title="Digital Adoption Issue"><Wifi className="w-3 h-3 text-indigo-400" /></div>}
                       </div>
                    </div>
                    <p className="text-[11px] text-red-900/60 dark:text-red-200/50 mt-1 leading-relaxed text-justify tracking-tight">{r.label}</p>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <p className="text-xl font-bold text-red-500">{r.value.toFixed(1)} <span className="text-[10px] font-normal opacity-60">units/mo</span></p>
                    <ArrowDownRight className="w-4 h-4 text-red-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

    </div>
  );
}
