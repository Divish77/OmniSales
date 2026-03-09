import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { MonthlyRevenue } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

interface RevenueChartProps {
  data: MonthlyRevenue[];
  loading: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const { format } = useCurrency();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="col-span-1 lg:col-span-3"
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm xs:text-base font-semibold text-slate-800 dark:text-slate-100">
            Monthly Sales Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[160px] xs:h-[200px] sm:h-[240px] lg:h-[280px] w-full flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "currentColor", opacity: 0.6 }} className="text-slate-600 dark:text-slate-400 text-xs" dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "currentColor", opacity: 0.6 }} className="text-slate-600 dark:text-slate-400 text-xs" tickFormatter={(v) => format(v, true)} width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--background)", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    formatter={(value: any) => [format(value), "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0, fill: "#4f46e5" }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
