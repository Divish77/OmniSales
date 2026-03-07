import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, PackageOpen, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProductChart } from "@/components/dashboard/ProductChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { useDashboardData } from "@/hooks/useDashboardData";

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function Dashboard() {
  const { totalRevenue, monthlyRevenue, topProducts, categories, loading, error } = useDashboardData();

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Overview
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor your business performance and real-time metrics.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live data…
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>
            <strong>Data error:</strong> {error}. Supabase credentials may be missing in{" "}
            <code className="font-mono">.env</code>.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          metric={loading ? "…" : formatCurrency(totalRevenue)}
          trend="+24.5%"
          icon={DollarSign}
          delay={0.1}
        />
        <KPICard
          title="Store Orders"
          metric={loading ? "…" : `${topProducts.reduce((a, p) => a + p.sales, 0).toLocaleString()}`}
          trend="+18.2%"
          icon={ShoppingCart}
          delay={0.2}
        />
        <KPICard
          title="Products in Chart"
          metric={loading ? "…" : String(topProducts.length)}
          trend="+32.1%"
          icon={PackageOpen}
          delay={0.3}
        />
        <KPICard
          title="Categories Tracked"
          metric={loading ? "…" : String(categories.length)}
          trend="+12.4%"
          icon={TrendingUp}
          delay={0.4}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        <RevenueChart data={monthlyRevenue} loading={loading} />
        <ProductChart data={topProducts} loading={loading} />
        <CategoryChart data={categories} loading={loading} />
      </div>
    </div>
  );
}
