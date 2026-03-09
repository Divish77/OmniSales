import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="col-span-1"
    >
      <Card className="glass-card h-full">
        <CardHeader>
          <CardTitle className="text-sm xs:text-base font-semibold text-slate-800 dark:text-slate-100">
            Sales by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[140px] xs:h-[160px] sm:h-[200px] lg:h-[260px] w-full flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="40%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
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
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "13px", right: 0, lineHeight: "24px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
