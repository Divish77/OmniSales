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
      <Card className="glass-card h-full">
        <CardHeader>
          <CardTitle className="text-sm xs:text-base font-semibold text-slate-800 dark:text-slate-100">
            Sales by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[140px] xs:h-[160px] sm:h-[200px] lg:h-[260px] w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div>
              {/* Mobile Layout: Stacked */}
              {isMobile ? (
                <div>
                  <div className="h-[160px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
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
                  {/* Mobile Legend - Grid Below Chart */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {data.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-xs">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Desktop Layout: Side-by-side
                <div className="h-[200px] sm:h-[260px] w-full flex items-center justify-center">
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
