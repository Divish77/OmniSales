import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchForecasts, fetchMonthlyRevenue, type Forecast, type MonthlyRevenue } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";
import { useGlobalFilters } from "@/context/FilterContext";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Loader2, TrendingUp, Brain, ArrowUpRight, ShieldCheck, Activity, ChevronLeft, ChevronRight } from "lucide-react";

const CAT_COLORS: Record<string, string> = {
  Electronics: "#4f46e5", Furniture: "#8b5cf6", Clothing: "#ec4899",
  Accessories: "#f59e0b", "Home Appliances": "#06b6d4", Automotive: "#f43f5e",
  Books: "#10b981", "Fashion & Apparel": "#a855f7", Groceries: "#84cc16",
  "Health & Beauty": "#f97316", "Home & Kitchen": "#14b8a6",
  "Industrial & Tools": "#64748b", "Jewelry & Watches": "#eab308",
  "Office Supplies": "#3b82f6", "Pet Supplies": "#d97706",
  "Sports & Outdoors": "#0ea5e9", "Toys & Games": "#e879f9",
};

function getCatColor(cat: string, index: number) {
  return CAT_COLORS[cat] || ["#4f46e5", "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"][index % 6];
}

export function ForecastsPage() {
  const [actuals, setActuals] = useState<MonthlyRevenue[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { format } = useCurrency();
  const { selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate } = useGlobalFilters();

  useEffect(() => {
    // Media query behavior handled via CSS/ResponsiveContainer
  }, []);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1); // Reset to page 1 on filter change
    Promise.all([
      fetchForecasts(selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate),
      fetchMonthlyRevenue(selectedCountry, selectedState, selectedProduct, selectedCategory, startDate, endDate)
    ])
      .then(([forecastData, actualData]) => {
        setForecasts(forecastData);
        setActuals(actualData.slice(-8));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth, startDate, endDate]);

  const categories = [...new Set(forecasts.map(f => f.category))];

  // Group by month for bridge chart (Actuals + Forecasts)
  const chartDataRaw = Array.from(
    [...actuals.map(a => ({ ...a, type: 'actual' })), 
     ...forecasts.map(f => ({ ...f, type: 'forecast', month: f.forecast_month }))
    ].reduce((map, item: any) => {
      const row = map.get(item.month) || { month: item.month, categories: [] } as any;
      if (item.type === 'actual') {
        row["Actual Total"] = Number(item.revenue);
      } else {
        const existingCat = row.categories.find((c: any) => c.name === item.category);
        if (existingCat) {
          existingCat.predicted += Number(item.predicted_revenue);
        } else {
          row.categories.push({ name: item.category, predicted: Number(item.predicted_revenue) });
        }
        row["Projected Total"] = (row["Projected Total"] || 0) + Number(item.predicted_revenue);
        row["upper_bound_sum"] = (row["upper_bound_sum"] || 0) + Number(item.upper_bound);
        row["lower_bound_sum"] = (row["lower_bound_sum"] || 0) + Number(item.lower_bound);

        row["Total Range"] = [row["lower_bound_sum"], row["upper_bound_sum"]];
      }
      map.set(item.month, row);
      return map;
    }, new Map<string, any>()).values()
  ).sort((a: any, b: any) => {
    const toNum = (s: string) => { 
      if (!s) return 0;
      const p = String(s).split("-"); 
      return parseInt(p[0]) * 100 + parseInt(p[1]); 
    };
    return toNum(a.month) - toNum(b.month);
  });

  // Connect the bridge
  let lastActualIdx = -1;
  for (let i = chartDataRaw.length - 1; i >= 0; i--) {
    if (chartDataRaw[i]["Actual Total"] !== undefined) {
      lastActualIdx = i;
      break;
    }
  }
  if (lastActualIdx !== -1) {
    chartDataRaw[lastActualIdx]["Projected Total"] = chartDataRaw[lastActualIdx]["Actual Total"];
    chartDataRaw[lastActualIdx]["Total Range"] = [chartDataRaw[lastActualIdx]["Actual Total"], chartDataRaw[lastActualIdx]["Actual Total"]];
  }
  
  const chartData = chartDataRaw;

  // Group forecasts by Month + Category + Top Product to unify regional splits into a single row
  const groupedForecasts = Array.from(forecasts.reduce((map, f) => {
    const key = `${f.forecast_month}|${f.category}|${f.top_product}`;
    if (!map.has(key)) {
      map.set(key, { ...f, predicted_revenue: Number(f.predicted_revenue), lower_bound: Number(f.lower_bound), upper_bound: Number(f.upper_bound) });
    } else {
      const existing = map.get(key)!;
      existing.predicted_revenue = Number(existing.predicted_revenue) + Number(f.predicted_revenue);
      existing.lower_bound = Number(existing.lower_bound) + Number(f.lower_bound);
      existing.upper_bound = Number(existing.upper_bound) + Number(f.upper_bound);
    }
    return map;
  }, new Map<string, Forecast>()).values());

  // Sort forecasts table rows by year/month numerically, then category
  const sortedForecasts = groupedForecasts.sort((a, b) => {
    const toNum = (s: string) => { const p = s.split("-"); return parseInt(p[0]) * 100 + parseInt(p[1]); };
    return toNum(a.forecast_month) - toNum(b.forecast_month) || a.category.localeCompare(b.category);
  });

  const totalPages = Math.ceil(sortedForecasts.length / itemsPerPage);
  const paginatedForecasts = sortedForecasts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Robust month formatter — avoids timezone/locale new Date() failures
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatMonth = (dateStr: string): string => {
    if (!dateStr) return "—";
    const parts = dateStr.split("-");
    if (parts.length < 2) return dateStr;
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${MONTHS[monthIdx] ?? "?"} ${parts[0]}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl min-w-[200px]">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{formatMonth(label)}</p>
          
          {data["Actual Total"] !== undefined && (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Historical: <span className="text-[#1e293b] dark:text-slate-200">{format(data["Actual Total"])}</span>
            </p>
          )}
          {data["Projected Total"] !== undefined && data["Total Range"]?.[0] !== data["Total Range"]?.[1] && (
            <>
              <p className="text-sm font-extrabold text-[#6366f1] mb-1">
                Projected: {format(data["Projected Total"])}
              </p>
              {data["Total Range"] && (
                <p className="text-[10px] text-slate-400 mb-3 font-medium">Confidence: {format(data["Total Range"][0], true)} — {format(data["Total Range"][1], true)}</p>
              )}
                   {data.categories && data.categories.length > 0 && (
                     <div className="space-y-1.5 mt-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category Breakdown</p>
                        {[...data.categories].sort((a:any, b:any) => b.predicted - a.predicted).map((c: any, i: number) => (
                           <div key={i} className="flex justify-between items-center text-xs gap-4">
                             <div className="flex items-center gap-1.5">
                               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCatColor(c.name, categories.indexOf(c.name)) }}></span>
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{c.name}</span>
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{format(c.predicted, true)}</span>
                      </div>
                   ))}
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Demand Forecast</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Predictive ML insights driven by Multivariate Random Forest analysis.</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="w-full relative z-[60]"
      >
        <DashboardFilters />
      </motion.div>

      {!loading && forecasts.length === 0 && (
        <Card className="glass-card border-slate-200 dark:border-slate-800">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-slate-400" />
            </div>
            
            {(selectedCountry || selectedState || selectedProduct || selectedCategory || selectedMonth) ? (
              <>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Data Available</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  We couldn't find any forecasts matching your current filter selection. Try adjusting your filters or clearing them.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Forecasts Not Yet Generated</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  The AI Demand Engine evaluates massive arrays of data mathematically. Please integrate the predictive ML pipeline to compute advanced stochastic projections.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {(loading || forecasts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-indigo-500" /> Revenue Bridge: Historic to Predicted
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading
                  ? <div className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                  : (
                    <div className="h-[400px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
                          <defs>
                            {/* SVG Filters for Premium Glow & Drop Shadows */}
                            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="6" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#4f46e5" floodOpacity="0.15" />
                            </filter>
                            
                            {/* Rich Dimensional Gradients */}
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>

                          {/* Minimalist Grid */}
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.06} />
                          
                          {/* Clean, Non-intrusive Axes */}
                          <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 400, fill: "#64748b" }} tickMargin={16} tickFormatter={formatMonth} strokeOpacity={0} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(v) => format(v, true)} tick={{ fontSize: 11, fontWeight: 400, fill: "#64748b" }} width={65} tickMargin={12} strokeOpacity={0} axisLine={false} tickLine={false} />
                          
                          {/* Rich Interactive Tooltip */}
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                          <Legend 
                            verticalAlign="top" align="center" height={50} iconType="circle" 
                            wrapperStyle={{ paddingBottom: '20px' }}
                            formatter={(value) => {
                              const colorMap: any = {
                                "Confidence Range": "#818cf8",
                                "Historical Baseline": "#1e293b",
                                "Projected Total": "#6366f1"
                              };
                              return <span style={{ color: colorMap[value] || '#64748b', fontWeight: 600, fontSize: '13px', marginLeft: '4px' }}>{value}</span>;
                            }}
                          />
                          
                          {/* Soft Halos & Fills */}
                          <Area type="monotone" dataKey="Total Range" stroke="none" fill="url(#projectedGrad)" name="Confidence Range" connectNulls />
                          <Area type="monotone" dataKey="Actual Total" stroke="none" fill="url(#actualGrad)" name="Historical Fill" legendType="none" connectNulls />
                          
                          {/* Crisp Striking Lines placed on top of fills */}
                          <Line type="monotone" dataKey="Actual Total" stroke="#1e293b" strokeWidth={3} filter="url(#softShadow)" dot={false} activeDot={{ r: 7, fill: "#ffffff", stroke: "#1e293b", strokeWidth: 3 }} name="Historical Baseline" connectNulls />

                          {/* Neon "Whipping" Dashed Line for Predictions */}
                          <Line type="monotone" dataKey="Projected Total" stroke="#6366f1" strokeWidth={3.5} strokeDasharray="8 6" filter="url(#softShadow)" dot={false} activeDot={{ r: 8, fill: "#ffffff", stroke: "#6366f1", strokeWidth: 3 }} name="Projected Total" connectNulls />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" /> Strategic Demand Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pt-2 pb-6 pr-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />)
                  ) : (
                    sortedForecasts.filter(f => f.insight_label).slice(0, 20).map((f, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-white/5 hover:border-indigo-500/30 transition-all group">
                         <div className="flex items-start justify-between mb-1">
                           <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">{f.category}</span>
                           <span className="text-[10px] text-slate-400 font-medium">{formatMonth(f.forecast_month)}</span>
                         </div>
                         <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                           {f.insight_label}
                         </p>
                         <div className="flex items-center gap-2 mb-3">
                           <Activity className="w-3 h-3 text-slate-400" />
                           <span className="text-[10px] text-slate-500 font-medium italic">Lead: {f.top_product}</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1 text-[10px] text-slate-500">
                             <ShieldCheck className="w-3 h-3 text-green-500" />
                             {f.confidence}% Conf.
                           </div>
                           <div className="flex items-center gap-1 text-[10px] text-slate-500">
                             <ArrowUpRight className="w-3 h-3 text-indigo-500" />
                             {format(f.predicted_revenue, true)} Est.
                           </div>
                         </div>
                      </div>
                    ))
                  )}
                  {!loading && forecasts.length > 0 && (
                    <p className="text-[10px] text-center text-slate-400 mt-4 italic">
                      Models refined daily using Multivariate Random Forest analysis.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Table Bottom */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3">
            <Card className="glass-card overflow-hidden">
               <CardHeader className="pb-0"><CardTitle className="text-lg">Forecast Breakdown</CardTitle></CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Timeline</th>
                          <th className="px-6 py-4">Sector</th>
                          <th className="px-6 py-4">Top Driver</th>
                          <th className="px-6 py-4">High Potential Estimate</th>
                          <th className="px-6 py-4">Confidence Range</th>
                          <th className="px-6 py-4">AI Insight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedForecasts.map((f, i) => (
                          <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group">
                            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{formatMonth(f.forecast_month)}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {f.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              {f.top_product}
                            </td>
                            <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{format(f.predicted_revenue)}</td>
                            <td className="px-6 py-4">
                              <div className="text-[10px] text-slate-500">
                                {format(f.lower_bound, true)} — {format(f.upper_bound, true)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[11px] text-slate-500 max-w-xs lowercase italic first-letter:uppercase truncate" title={f.insight_label}>
                              {f.insight_label}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedForecasts.length)} of {sortedForecasts.length} entries
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
               </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
