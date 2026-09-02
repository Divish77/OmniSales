import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import type { ChannelTrend } from "@/lib/api";

interface ChannelTrendChartProps {
  data: ChannelTrend[];
  loading: boolean;
}

export function ChannelTrendChart({ data, loading }: ChannelTrendChartProps) {
  const { format } = useCurrency();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Revenue Trend by Channel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          ) : data.length === 0 ? (
            <p className="text-sm text-slate-500">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: isMobile ? 10 : 30, left: isMobile ? -20 : 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorStore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "var(--foreground)", opacity: 0.6, fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "var(--foreground)", opacity: 0.6, fontSize: 12 }}
                  tickFormatter={(value) => format(value, true)} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--background)", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                  formatter={(value: any) => [format(Number(value), true), undefined]}
                  labelStyle={{ fontWeight: "bold", marginBottom: "8px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Area type="monotone" dataKey="online_revenue" name="Online" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorOnline)" activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="store_revenue" name="In-Store" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorStore)" activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
