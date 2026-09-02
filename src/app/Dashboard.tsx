import { motion } from "framer-motion";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ChannelRevenueCard } from "@/components/dashboard/ChannelRevenueCard";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useGlobalFilters } from "@/context/FilterContext";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { MainKpiCards } from "@/components/dashboard/MainKpiCards";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { DATE_PRESET_LABELS } from "@/context/FilterContext";

export function Dashboard() {
  const {
    selectedCountry,
    selectedState,
    selectedProduct,
    selectedCategory,
    startDate,
    endDate,
    datePreset,
  } = useGlobalFilters();

  const { totalRevenue, monthlyRevenue, channelRevenue, categories, topProducts, totalOrders, loading } = useDashboardData(
    selectedCountry,
    selectedState,
    selectedProduct,
    selectedCategory,
    startDate,
    endDate,
  );

  return (
    <div className="flex-1 space-y-6 sm:space-y-8 p-3 xs:p-4 sm:p-6 lg:p-8 pt-5">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <h2 className="text-2xl xs:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics across your global sales channels.
            <span className="ml-2 text-indigo-500 font-semibold">
              {DATE_PRESET_LABELS[datePreset]}
            </span>
          </p>
        </motion.div>
      </div>

      {/* Global Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="w-full relative z-[60]"
      >
        <DashboardFilters />
      </motion.div>

      {/* AI Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="w-full relative z-[50]"
      >
        <AISummaryCard />
      </motion.div>

      {/* Top Main Two Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <MainKpiCards totalRevenue={totalRevenue} totalOrders={totalOrders} loading={loading} />
      </motion.div>

      {/* Revenue Chart — Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full"
      >
        <RevenueChart data={monthlyRevenue} loading={loading} />
      </motion.div>

      {/* Channel Performance + Top Products — Equal 50/50 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2"
      >
        <ChannelRevenueCard data={channelRevenue} loading={loading} />
        <TopProductsChart data={topProducts} loading={loading} />
      </motion.div>

      {/* Category Chart — Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full"
      >
        <CategoryChart data={categories} loading={loading} />
      </motion.div>

    </div>
  );
}
