import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Users, RefreshCw } from "lucide-react";
import {
  fetchChannelPreference, fetchChannelTrend, fetchRepeatProducts,
  type ChannelPreference, type ChannelTrend, type RepeatProduct,
} from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

export function CustomerBehaviorPage() {
  const [prefs, setPrefs] = useState<ChannelPreference[]>([]);
  const [trends, setTrends] = useState<ChannelTrend[]>([]);
  const [repeats, setRepeats] = useState<RepeatProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    Promise.all([fetchChannelPreference(), fetchChannelTrend(), fetchRepeatProducts()])
      .then(([p, t, r]) => { setPrefs(p); setTrends(t); setRepeats(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Behavior</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Agent 3 — Channel preferences, purchase trends, and loyalty patterns.</p>
      </motion.div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Online vs Store Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-2">
          <Card className="glass-card">
            <CardHeader><CardTitle>Online vs Store — Monthly Trend</CardTitle></CardHeader>
            <CardContent>
              {loading
                ? <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => format(v, true)} tick={{ fontSize: 11 }} width={70} />
                        <Tooltip formatter={(v: number) => [format(v, true)]} />
                        <Legend />
                        <Line type="monotone" dataKey="online_revenue" name="Online" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="store_revenue" name="Store" stroke="#8b5cf6" strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Channel Preference by Region */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />Channel Preference by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="h-56 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                : (
                  <div className="space-y-3">
                    {prefs.slice(0, 8).map((p) => (
                      <div key={p.region} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{p.region}</span>
                          <span className={p.dominant_channel === "online" ? "text-indigo-600" : "text-purple-600"}>
                            {p.dominant_channel === "online" ? "🌐" : "🏪"} {p.dominant_channel}
                          </span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <div className="bg-indigo-500 h-full transition-all" style={{ width: `${p.online_pct}%` }} />
                          <div className="bg-purple-400 h-full transition-all" style={{ width: `${p.store_pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Online {p.online_pct}%</span>
                          <span>Store {p.store_pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>

        {/* High-Frequency Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-500" />High-Purchase Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="h-56 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                : repeats.length === 0
                  ? <p className="text-slate-400 text-sm text-center py-8">No repeat purchase data yet.</p>
                  : (
                    <div className="space-y-3">
                      {repeats.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.product_name}</p>
                            <p className="text-xs text-slate-400">{r.category} · {r.channels}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-indigo-600">{r.total_units} units</p>
                            <p className="text-xs text-slate-400">avg {r.avg_quantity}/order</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
