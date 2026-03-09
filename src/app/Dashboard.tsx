import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ChannelRevenueCard } from "@/components/dashboard/ChannelRevenueCard";
import { GeographicMap } from "@/components/dashboard/GeographicMap";
import { MainKpiCards } from "@/components/dashboard/MainKpiCards";
import { CategoryChart } from "@/components/dashboard/CategoryChart";

export function Dashboard() {
  const { totalRevenue, monthlyRevenue, channelRevenue, regionalDemand, categories, totalOrders, loading } = useDashboardData();

  return (
    <div className="flex-1 space-y-4 xs:space-y-5 sm:space-y-6 p-3 xs:p-4 sm:p-6 lg:p-8 pt-4 xs:pt-5 sm:pt-6 max-w-7xl mx-auto">

      <div>
        <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 font-medium mt-1 max-w-3xl text-xs xs:text-sm sm:text-base">
          Start exploring your live KPI metrics. Access a breakdown of revenue from online and store channels, track orders geographically, and see which categories are growing fastest.
        </p>
      </div>

      {/* Top Main Two Cards */}
      <MainKpiCards totalRevenue={totalRevenue} totalOrders={totalOrders} loading={loading} />

      {/* Bottom Grid Cards */}
      <div className="grid gap-3 xs:gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <RevenueChart data={monthlyRevenue} loading={loading} />
        <ChannelRevenueCard data={channelRevenue} loading={loading} />
        <GeographicMap data={regionalDemand} loading={loading} />
        <CategoryChart data={categories} loading={loading} />
      </div>

    </div>
  );
}
