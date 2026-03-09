import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Globe, Store } from "lucide-react";
import {
  fetchChannelRevenue, fetchCategoryPerformance, fetchRegionalDemand,
  type ChannelRevenue, type CategoryPerformance, type RegionalDemand,
} from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

export function SalesAnalyticsPage() {
  const [channels, setChannels] = useState<ChannelRevenue[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [regions, setRegions] = useState<RegionalDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    Promise.all([fetchChannelRevenue(), fetchCategoryPerformance(), fetchRegionalDemand()])
      .then(([ch, cat, reg]) => { setChannels(ch); setCategories(cat); setRegions(reg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = channels.reduce((s, c) => s + Number(c.revenue), 0);

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Analytics</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">See how your revenue splits between your online store and physical locations, which categories drive the most sales, and where your strongest regional demand is.</p>
      </motion.div>

      {/* Channel Split Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? [0, 1].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)
          : channels.map((ch, i) => (
            <motion.div key={ch.channel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10">
                    {ch.channel === "online" ? <Globe className="h-6 w-6 text-indigo-600" /> : <Store className="h-6 w-6 text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 capitalize">{ch.channel} Channel</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{format(Number(ch.revenue), true)}</p>
                    <p className="text-xs text-slate-400">{ch.orders} orders · avg {format(Number(ch.avg_order_value))}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {totalRevenue > 0 ? ((Number(ch.revenue) / totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-slate-400">of total</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        }
      </div>

      <div className="grid gap-4 md:gap-8 grid-cols-1 xl:grid-cols-2">
        {/* Category Performance */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card h-full">
            <CardHeader><CardTitle>Category Performance</CardTitle></CardHeader>
            <CardContent>
              {loading
                ? <div className="h-60 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                : (
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <div key={cat.category} className="flex items-center gap-3">
                        <div className="w-28 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{cat.category}</div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, (Number(cat.revenue) / (categories[0]?.revenue || 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="text-right w-28">
                          <p className="text-sm font-semibold">{format(Number(cat.revenue), true)}</p>
                          <p className="text-xs text-slate-400">{cat.channel_split}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Regional Demand */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card h-full">
            <CardHeader><CardTitle>Regional Demand</CardTitle></CardHeader>
            <CardContent>
              {loading
                ? <div className="h-60 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regions.slice(0, 8)} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                        <XAxis dataKey="region" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => format(v, true)} tick={{ fontSize: 10 }} width={70} />
                        <Tooltip formatter={(v: number) => [format(v, true), "Revenue"]} />
                        <Bar dataKey="revenue" fill="url(#regionGrad)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="regionGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
