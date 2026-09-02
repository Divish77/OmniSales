import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAIInsightsV2, type AIInsight } from "@/lib/api";
import { useGlobalFilters } from "@/context/FilterContext";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Loader2, Sparkles, TrendingUp, TrendingDown,
  ShieldAlert, Globe, Calendar, Zap,
  Activity, Brain, Target
} from "lucide-react";

// ── Config: Insight type metadata ─────────────────────────────────────────────
const INSIGHT_CONFIG = {
  anomaly: {
    icon: Activity,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    glyph: "⚡",
    label: "Anomaly",
  },
  trend_acceleration: {
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    glyph: "🚀",
    label: "Accelerating",
  },
  trend_cooling: {
    icon: TrendingDown,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    glyph: "📉",
    label: "Cooling",
  },
  seasonality: {
    icon: Calendar,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
    glyph: "📅",
    label: "Seasonal",
  },
  risk: {
    icon: ShieldAlert,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    glyph: "⚠️",
    label: "Risk",
  },
  regional_delta: {
    icon: Globe,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400",
    glyph: "🌍",
    label: "Regional",
  },
};

const IMPACT_CONFIG = {
  high:   { dot: "bg-rose-500",   label: "High Impact",   ring: "ring-rose-500/30" },
  medium: { dot: "bg-amber-500",  label: "Medium Impact", ring: "ring-amber-500/30" },
  low:    { dot: "bg-sky-500",    label: "Low Impact",    ring: "ring-sky-500/30" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const config = INSIGHT_CONFIG[insight.insight_type] ?? INSIGHT_CONFIG.anomaly;
  const impact = IMPACT_CONFIG[insight.impact_level] ?? IMPACT_CONFIG.low;
  const Icon = config.icon;

  // Generate compact stat chips from data (no prose body)
  const stats: { label: string; value: string }[] = [];
  if (insight.metric_value !== null && insight.metric_label) {
    stats.push({ label: insight.metric_label, value: insight.metric_value.toLocaleString() });
  }
  if (insight.country) stats.push({ label: "Market", value: insight.country });
  if (insight.state && insight.state !== "Unknown") stats.push({ label: "State",  value: insight.state });
  if (insight.product_name) stats.push({ label: "Product", value: insight.product_name });
  if (insight.insight_month) stats.push({ label: "Period", value: insight.insight_month });
  stats.push({ label: "Signal", value: config.label });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <Card className={`glass-card border transition-all duration-200 hover:shadow-md group ${config.border}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ring-1 ${impact.ring}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate">
                  {insight.title}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${impact.dot.replace("bg-", "bg-").replace("-500", "-100")} ${impact.dot.replace("bg-", "text-").replace("-500", "-700")} dark:bg-opacity-20`}>
                  {impact.label}
                </span>
              </div>

              {/* Stat chips row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</span>
                    <span className={`text-[10px] font-black ${i === 0 ? config.color : "text-slate-700 dark:text-slate-200"}`}>{s.value}</span>
                  </div>
                ))}
                {insight.category && (
                  <div className={`flex items-center gap-1 ${config.bg} rounded-lg px-2 py-1`}>
                    <span className={`text-[10px] font-black ${config.color}`}>{insight.category}</span>
                  </div>
                )}
              </div>
              
              {/* Context text */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-4">
                {insight.body}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}




function KPICard({
  title, value, sub, icon: Icon, color, delay
}: { title: string; value: string; sub: string; icon: any; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={`glass-card border ${color.replace("text-", "border-").replace("-500", "-500/20")} bg-gradient-to-br ${color.replace("text-", "from-").replace("-500", "-500/5")} to-transparent`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`h-9 w-9 rounded-lg ${color.replace("text-", "bg-").replace("-500", "-500/15")} flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          <p className={`text-2xl font-black ${color} leading-none mb-1`}>{value}</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{title}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 italic">{sub}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const {} = useCurrency();
  const { selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate } = useGlobalFilters();

  const hasFilters = !!(selectedCountry || selectedState || selectedProduct || selectedCategory || selectedMonth);

  useEffect(() => {
    setLoading(true);
    fetchAIInsightsV2({
      country: selectedCountry,
      state: selectedState,
      product: selectedProduct,
      category: selectedCategory,
      month: selectedMonth,
      startDate,
      endDate,
    })
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate]);

  // KPI derivations
  const kpis = useMemo(() => {
    const high   = insights.filter(i => i.impact_level === "high");
    const accel  = insights.filter(i => i.insight_type === "trend_acceleration");
    const risk   = insights.filter(i => i.insight_type === "risk");
    const topCat = accel.length > 0 
      ? ([...accel].sort((a,b) => (b.metric_value||0) - (a.metric_value||0))[0].product_name || accel[0].category || "—") 
      : "—";
    
    // Strategic Pulse Calculations
    const cooling = insights.filter(i => i.insight_type === "trend_cooling");
    const pulseRatio = insights.length > 0 ? (accel.length / (accel.length + cooling.length + 0.1)) * 100 : 50;
    const topGrowth = accel.length > 0 ? [...accel].sort((a,b) => (b.metric_value||0) - (a.metric_value||0))[0] : null;
    const topDanger = risk.length > 0 ? [...risk].sort((a,b) => (b.metric_value||0) - (a.metric_value||0))[0] : null;

    // Aggregate category health for the watchlist
    const cats = new Map<string, { total: number, high: number, accel: boolean, risk: boolean }>();
    insights.forEach(i => {
      if (!i.category) return;
      if (!cats.has(i.category)) cats.set(i.category, { total: 0, high: 0, accel: false, risk: false });
      const c = cats.get(i.category)!;
      c.total += 1;
      if (i.impact_level === "high") c.high += 1;
      if (i.insight_type === "trend_acceleration") c.accel = true;
      if (i.insight_type === "risk" || i.insight_type === "trend_cooling") c.risk = true;
    });
    const watchlist = Array.from(cats.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.high - a.high || b.total - a.total)
      .slice(0, 4);

    return { high, accel, risk, topCat, watchlist, pulseRatio, topGrowth, topDanger };
  }, [insights]);

  // Filtered insights based on active tab
  const filteredInsights = useMemo(() => {
    if (activeFilter === "all") return insights;
    return insights.filter(i => i.insight_type === activeFilter || i.impact_level === activeFilter);
  }, [insights, activeFilter]);

  const filterTabs = [
    { id: "all",                 label: "All",           count: insights.length },
    { id: "high",                label: "🔴 High",       count: insights.filter(i => i.impact_level === "high").length },
    { id: "trend_acceleration",  label: "🚀 Momentum",   count: insights.filter(i => i.insight_type === "trend_acceleration").length },
    { id: "trend_cooling",       label: "📉 Cooling",    count: insights.filter(i => i.insight_type === "trend_cooling").length },
    { id: "risk",                label: "⚠️ Risk",        count: insights.filter(i => i.insight_type === "risk").length },
    { id: "seasonality",         label: "📅 Seasonal",   count: insights.filter(i => i.insight_type === "seasonality").length },
    { id: "regional_delta",      label: "🌍 Regional",   count: insights.filter(i => i.insight_type === "regional_delta").length },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 pt-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">AI Insights</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Self-trained ML engine — YoY Normalization + Statistical Significance Check
            </p>
          </div>
        </motion.div>

        {/* Status Badges */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-end gap-2">
          {hasFilters && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Analysis Scope:</span>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                {[
                  selectedCountry,
                  selectedState,
                  selectedProduct,
                  selectedCategory,
                  selectedMonth,
                ].filter(Boolean).join(" • ") || "Global Portfolio"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Local ML · High Accuracy Sync</span>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="w-full relative z-[60]">
        <DashboardFilters />
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-indigo-500" />
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500 absolute -top-1 -right-1" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Querying ML Insights...</p>
            <p className="text-xs text-slate-500 mt-1">Fetching pre-trained model outputs from database</p>
          </div>
        </div>
      ) : insights.length === 0 ? (
        /* Empty State */
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass-card border-slate-200 dark:border-slate-800">
            <CardContent className="p-16 text-center">
              <div className="mx-auto w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="h-10 w-10 text-indigo-400" />
              </div>
              {hasFilters ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Data Available</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm">
                    No ML insights match your current filter selection. Try broadening your filters.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Engine Not Trained Yet</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
                    Run the self-contained ML engine to train models on your sales data and generate AI insights.
                  </p>
                  <code className="inline-block bg-slate-900 text-emerald-400 rounded-xl px-6 py-4 text-sm font-mono text-left border border-slate-700 shadow-xl">
                    python ai_insights_engine.py
                  </code>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* ── KPI Hero Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              title={selectedCountry ? `Signals in ${selectedCountry}` : "High-Impact Signals"}
              value={`${kpis.high.length}`}
              sub="Require immediate attention"
              icon={Zap}
              color="text-rose-500"
              delay={0.1}
            />
            <KPICard
              title={
                selectedState ? `Top Growth in ${selectedState}` :
                selectedCountry ? `Top Growth in ${selectedCountry}` :
                "Accelerating Categories"
              }
              value={kpis.accel.length > 0 ? kpis.topCat : "None"}
              sub={kpis.accel.length > 0 ? `+${kpis.accel.length} momentum signals detected` : "No momentum signals"}
              icon={TrendingUp}
              color="text-emerald-500"
              delay={0.15}
            />
            <KPICard
              title={selectedCountry ? `Risks in ${selectedCountry}` : "Concentration Risks"}
              value={`${kpis.risk.length}`}
              sub="High product dependency detected"
              icon={ShieldAlert}
              color="text-amber-500"
              delay={0.2}
            />
          </div>

          {/* ── Filter Tabs ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeFilter === tab.id ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Insight Feed ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-3 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredInsights.length === 0 ? (
                  <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-sm text-slate-400">No insights for this filter.</p>
                  </div>
                ) : (
                  filteredInsights.map((insight, i) => (
                    <InsightCard key={insight.id} insight={insight} index={i} />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Right: Summary Panel */}
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

              {/* Category Watchlist Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Card className="glass-card border-indigo-200 dark:border-indigo-500/25 relative overflow-hidden">
                  <div className="absolute bottom-[-10px] right-[-10px] opacity-[0.03] pointer-events-none">
                    <Activity className="h-24 w-24 text-indigo-500" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                      <Activity className="h-4 w-4" />
                      Category Watchlist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {kpis.watchlist.length === 0 ? (
                      <p className="text-xs text-slate-500">No categories to track right now.</p>
                    ) : (
                      kpis.watchlist.map((cat) => (
                        <div key={cat.name} className="flex flex-col gap-1.5 group">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{cat.name}</p>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {cat.total} Signals
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {cat.high > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                                {cat.high} High Impact
                              </span>
                            )}
                            {cat.accel && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                🚀 Growing
                              </span>
                            )}
                            {cat.risk && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                                ⚠️ At Risk
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Market Opportunity Hub */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card className="glass-card border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.02] to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      Strategic Opportunity Hub
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Market Pulse */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">MARKET PULSE</span>
                        <span className={kpis.pulseRatio > 50 ? "text-emerald-500" : "text-amber-500"}>
                          {kpis.pulseRatio > 70 ? "Aggressive Growth" : kpis.pulseRatio > 40 ? "Steady" : "Cooling"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${kpis.pulseRatio}%` }}
                          className={`h-full rounded-full ${kpis.pulseRatio > 50 ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      {kpis.topGrowth && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Top Rocket Candidate</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{kpis.topGrowth.product_name || kpis.topGrowth.category}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">+{kpis.topGrowth.metric_value}% velocity in {kpis.topGrowth.state || kpis.topGrowth.country}</p>
                        </div>
                      )}

                      {kpis.topDanger && (
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                          <p className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Primary Vulnerability</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{kpis.topDanger.category}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">Extreme dependence on {kpis.topDanger.product_name}</p>
                        </div>
                      )}

                      {!kpis.topGrowth && !kpis.topDanger && (
                        <p className="text-xs text-slate-400 text-center py-4">Analyzed signals show stable conditions.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
