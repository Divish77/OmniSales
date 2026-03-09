import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { CategorySlice } from "@/lib/api";

const COLORS = [
  "#4f46e5", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#3b82f6", // Blue
];

interface CategoryChartProps {
  data: CategorySlice[];
  loading: boolean;
}

export function CategoryChart({ data, loading }: CategoryChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="col-span-1"
    >
      <Card className="glass-card h-full flex flex-col items-center justify-center py-6">
        <CardHeader className="w-full flex items-center justify-center pb-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 text-center w-full">
            Sales by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center w-full">
          {loading ? (
            <div className="h-[140px] xs:h-[160px] sm:h-[200px] lg:h-[260px] w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              <div className="w-full flex items-center justify-center">
                <ResponsiveContainer width="90%" height={180} minWidth={120} minHeight={120}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1500}
                      stroke="none"
                    >
                      {data.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      formatter={(value: any) => [`${value}%`, "Share"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend below chart, always centered */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-2 w-full max-w-xs mx-auto">
                {data.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs sm:text-sm">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
