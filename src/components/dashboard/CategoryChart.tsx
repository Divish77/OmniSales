import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { CategorySlice } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

const CATEGORY_COLORS: Record<string, string> = {
  "Accessories": "#f59e0b",
  "Clothing": "#ec4899",
  "Electronics": "#4f46e5",
  "Furniture": "#8b5cf6",
  "Home Appliances": "#06b6d4",
  "Automotive": "#f43f5e",
  "Books": "#10b981",
  "Fashion & Apparel": "#a855f7",
  "Groceries": "#84cc16",
  "Health & Beauty": "#f97316",
  "Home & Kitchen": "#14b8a6",
  "Industrial & Tools": "#64748b",
  "Jewelry & Watches": "#eab308",
  "Office Supplies": "#3b82f6",
  "Pet Supplies": "#d97706",
  "Sports & Outdoors": "#0ea5e9",
  "Toys & Games": "#e879f9",
};

const DYNAMIC_PALETTE = [
  "#3b82f6", "#14b8a6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#6366f1", "#0ea5e9", "#eab308",
];

function getCategoryColor(name: string) {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DYNAMIC_PALETTE[Math.abs(hash) % DYNAMIC_PALETTE.length];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.payload.fill }} />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.name}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Revenue: <span className="font-bold text-slate-700 dark:text-slate-200">${Number(entry.value).toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface CategoryChartProps {
  data: CategorySlice[];
  loading: boolean;
}

export function CategoryChart({ data, loading }: CategoryChartProps) {
  const { format } = useCurrency();

  const activeData = data.filter(d => Number(d.value) > 0);
  const totalRevenue = activeData.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full"
    >
      <Card className="glass-card w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Sales by Category
            </CardTitle>
            {!loading && totalRevenue > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total: <span className="font-bold text-indigo-600 dark:text-indigo-400">{format(totalRevenue, true)}</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-stretch">

              {/* Donut Chart */}
              <div className="flex-shrink-0 w-full md:w-64 h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeData.length > 0 ? activeData : [{ name: "No Data", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={108}
                      paddingAngle={activeData.length > 1 ? 3 : 0}
                      dataKey="value"
                      animationDuration={1200}
                      stroke="none"
                    >
                      {activeData.length > 0
                        ? activeData.map((entry: CategorySlice, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getCategoryColor(entry.name)}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          ))
                        : <Cell fill="#e2e8f0" />
                      }
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend — fills remaining width in responsive columns */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 content-start py-1">
                {data.map((cat: CategorySlice) => {
                  const value = Number(cat.value);
                  const pct = totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : "0.0";
                  const color = getCategoryColor(cat.name);
                  const active = value > 0;
                  return (
                    <div key={cat.name} className="flex items-start gap-2 min-w-0">
                      <div
                        className="mt-[3px] flex-shrink-0 w-2.5 h-2.5 rounded-full"
                        style={{ background: active ? color : "#cbd5e1" }}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${active ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"}`}>
                          {cat.name}
                        </p>
                        <p className="text-[11px] mt-0.5">
                          {active ? (
                            <>
                              <span className="font-bold" style={{ color }}>{pct}%</span>
                              <span className="text-slate-400 dark:text-slate-500"> · {format(value, true)}</span>
                            </>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">No sales yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
