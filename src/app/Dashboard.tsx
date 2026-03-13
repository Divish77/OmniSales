import { motion } from "framer-motion";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ChannelRevenueCard } from "@/components/dashboard/ChannelRevenueCard";
import { GeographicMap } from "@/components/dashboard/GeographicMap";
import { MainKpiCards } from "@/components/dashboard/MainKpiCards";
import { CategoryChart } from "@/components/dashboard/CategoryChart";

export function Dashboard() {
  const { totalRevenue, monthlyRevenue, channelRevenue, regionalDemand, categories, totalOrders, loading } = useDashboardData();

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">

      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Start exploring your live KPI metrics. Access a breakdown of revenue from online and store channels, track orders geographically, and see which categories are growing fastest.
        </p>
      </motion.div>

      {/* Top Main Two Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <MainKpiCards totalRevenue={totalRevenue} totalOrders={totalOrders} loading={loading} />
      </motion.div>

      {/* Bottom Grid Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        <RevenueChart data={monthlyRevenue} loading={loading} />
        <ChannelRevenueCard data={channelRevenue} loading={loading} />
        <GeographicMap data={regionalDemand} loading={loading} />
        <CategoryChart data={categories} loading={loading} />
      </motion.div>

    </div>
  );
}
