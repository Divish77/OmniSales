import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import type { TopProduct } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

const CATEGORY_COLORS: Record<string, string> = {
  "Accessories":      "#f59e0b",
  "Automotive":       "#f43f5e",
  "Books":            "#10b981",
  "Clothing":         "#ec4899",
  "Electronics":      "#4f46e5",
  "Fashion & Apparel":"#a855f7",
  "Furniture":        "#8b5cf6",
  "Groceries":        "#84cc16",
  "Health & Beauty":  "#f97316",
  "Home & Kitchen":   "#14b8a6",
  "Home Appliances":  "#06b6d4",
  "Industrial & Tools":"#64748b",
  "Jewelry & Watches":"#eab308",
  "Office Supplies":  "#3b82f6",
  "Pet Supplies":     "#d97706",
  "Sports & Outdoors":"#0ea5e9",
  "Toys & Games":     "#e879f9",
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#6366f1";
}

interface TopProductsChartProps {
  data: TopProduct[];
  loading: boolean;
}

export function TopProductsChart({ data, loading }: TopProductsChartProps) {
  const { format } = useCurrency();
  const maxRevenue = data[0] ? Number(data[0].revenue) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="col-span-1 min-w-0 flex flex-col"
    >
      <Card className="glass-card h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Top Products
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              By Revenue
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex flex-col flex-1 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No product data available
            </div>
          ) : (
            <div className="flex flex-col justify-between flex-1 gap-1">
              {data.map((product, i) => {
                const rev = Number(product.revenue);
                const pct = Math.max(4, (rev / maxRevenue) * 100);
                const color = getCategoryColor(product.category);
                return (
                  <motion.div
                    key={`${product.product_name}-${i}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                    className="group flex flex-col justify-center flex-1 py-1"
                  >
                    {/* Label row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                          style={{ background: color }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">
                            {product.product_name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                            {product.category} · {Number(product.units_sold).toLocaleString()} units
                          </p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-bold text-slate-700 dark:text-slate-200 ml-2">
                        {format(rev, true)}
                      </span>
                    </div>

                    {/* Animated progress bar */}
                    <div className="relative h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
