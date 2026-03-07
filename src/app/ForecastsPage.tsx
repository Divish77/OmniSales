import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Brain } from "lucide-react";
import { fetchForecasts, type Forecast } from "@/lib/api";

export function ForecastsPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts().then(setForecasts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(forecasts.map(f => f.category))];
  
  // Group by month for chart
  const monthMap = new Map<string, Record<string, number>>();
  forecasts.forEach(f => {
    if (!monthMap.has(f.forecast_month)) monthMap.set(f.forecast_month, { month: f.forecast_month });
    monthMap.get(f.forecast_month)![f.category] = Number(f.predicted_revenue);
  });
  const chartData = Array.from(monthMap.values());

  const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b"];

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Demand Forecast</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Agent 4 — ML predictions using Linear Regression on historical sales trends.</p>
      </motion.div>

      {forecasts.length === 0 && !loading && (
        <Card className="glass-card border-indigo-200 dark:border-indigo-500/30">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Forecasts Not Yet Generated</h3>
            <p className="text-slate-500 text-sm mb-4">Run the Python ML agent to generate demand forecasts.</p>
            <code className="block bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 text-sm font-mono text-indigo-600 dark:text-indigo-400">
              pip install supabase scikit-learn pandas numpy python-dateutil<br />
              python agents/forecasting_agent.py
            </code>
          </CardContent>
        </Card>
      )}

      {(loading || forecasts.length > 0) && (
        <>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-indigo-500" />Predicted Revenue by Category</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="h-72 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div> : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          {categories.map((cat, i) => (
                            <linearGradient key={cat} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                        <Legend />
                        {categories.map((cat, i) => (
                          <Area key={cat} type="monotone" dataKey={cat} stroke={COLORS[i % COLORS.length]} fill={`url(#grad${i})`} strokeWidth={2} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Forecast Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card">
              <CardHeader><CardTitle>Forecast Details</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Month</th>
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Category</th>
                        <th className="text-right py-2 px-3 text-slate-500 font-medium">Predicted Revenue</th>
                        <th className="text-right py-2 px-3 text-slate-500 font-medium">Predicted Units</th>
                        <th className="text-right py-2 px-3 text-slate-500 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecasts.map((f, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-medium">{f.forecast_month}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{f.category}</td>
                          <td className="py-2 px-3 text-right font-semibold text-indigo-600">${Number(f.predicted_revenue).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">{f.predicted_quantity?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${Number(f.confidence) > 70 ? "bg-green-100 text-green-700" : Number(f.confidence) > 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {f.confidence ?? "—"}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
