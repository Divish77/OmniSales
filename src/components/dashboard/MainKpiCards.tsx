import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Eye, Activity, Loader2, ChevronRight } from "lucide-react";

interface MainKpiCardsProps {
  totalRevenue: number;
  totalOrders: number;
  loading: boolean;
}

export function MainKpiCards({ totalRevenue, totalOrders, loading }: MainKpiCardsProps) {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="grid gap-3 xs:gap-4 grid-cols-1 sm:grid-cols-3 min-h-[180px] xs:min-h-[200px]">
        <div className="lg:col-span-2 glass-card bg-pastel-blue-teal rounded-[30px] flex items-center justify-center border-0 shadow-sm relative overflow-hidden">
          <Loader2 className="h-8 xs:h-10 w-8 xs:w-10 animate-spin text-white/50" />
        </div>
        <div className="glass-card bg-pastel-peach-beige rounded-[30px] flex items-center justify-center shadow-sm border-0 relative overflow-hidden">
          <Loader2 className="h-8 xs:h-10 w-8 xs:w-10 animate-spin text-orange-400/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 xs:gap-4 grid-cols-1 sm:grid-cols-3">
      {/* Large KPI Card - Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2 glass-card bg-pastel-blue-teal rounded-[30px] xs:rounded-[35px] sm:rounded-[40px] p-4 xs:p-5 sm:p-7 flex flex-col shadow-sm border-0 relative overflow-hidden h-full min-h-[200px] xs:min-h-[220px] sm:min-h-[240px]"
      >
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <h3 className="text-white text-base xs:text-lg font-medium opacity-90 mb-1.5 xs:mb-2">Total Revenue</h3>
          
          <div className="flex items-start gap-0.5 xs:gap-1 mb-4 xs:mb-6 mt-1">
            <span className="text-2xl xs:text-3xl font-bold text-white/70 mt-1 xs:mt-2">$</span>
            <span className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-none">
              {totalRevenue.toLocaleString()}
            </span>
          </div>
          
          <div className="flex gap-4 xs:gap-6 sm:gap-8 mt-1 xs:mt-2">
            <div className="flex items-center gap-1.5 xs:gap-2">
              <div className="bg-white/10 p-1 xs:p-1.5 rounded-full"><Eye className="w-2.5 xs:w-3 h-2.5 xs:h-3 text-white/80" /></div>
              <div>
                <div className="text-white/60 text-[10px] xs:text-xs font-medium">Views</div>
                <div className="text-white font-bold text-xs xs:text-sm leading-tight">24.5k</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2">
              <div className="bg-white/10 p-1 xs:p-1.5 rounded-full"><Activity className="w-2.5 xs:w-3 h-2.5 xs:h-3 text-white/80" /></div>
              <div>
                <div className="text-white/60 text-[10px] xs:text-xs font-medium">Conversion</div>
                <div className="text-white font-bold text-xs xs:text-sm leading-tight">3.2%</div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-3 xs:pt-4 sm:pt-5">
            <button 
              onClick={() => navigate('/sales')} 
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 rounded-2xl font-bold text-[10px] xs:text-xs uppercase tracking-[0.12em] xs:tracking-[0.15em] flex items-center shadow-xl transition-all group w-fit border border-white/10"
            >
              View full statistic 
              <ChevronRight className="w-3 xs:w-4 h-3 xs:h-4 ml-2 xs:ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-black/10 rounded-full blur-[80px] pointer-events-none" />
      </motion.div>

      {/* Small KPI Card - Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card bg-pastel-peach-beige rounded-[30px] xs:rounded-[35px] sm:rounded-[40px] shadow-sm border-0 relative overflow-hidden h-full group flex flex-col items-center justify-center"
      >
        <div className="p-4 xs:p-5 sm:p-7 w-full flex flex-col items-center text-center">
          <div className="mb-3 xs:mb-4">
            <div className="bg-white p-2.5 xs:p-3 rounded-2xl border border-white shadow-sm flex items-center justify-center mx-auto">
              <ShoppingBag className="w-5 xs:w-6 h-5 xs:h-6 text-orange-500" strokeWidth={2.5} />
            </div>
          </div>
          
          <h3 className="text-[#13313D] text-base xs:text-lg font-bold tracking-tight mb-2 xs:mb-3">Total Orders</h3>
          
          <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4">
            <span className="text-4xl xs:text-5xl sm:text-6xl font-black tracking-tighter text-[#13313D] leading-none">
              {totalOrders.toLocaleString()}
            </span>
            <div className="bg-white/90 text-[#059669] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-white shadow-sm flex items-center h-fit">
              +12%
            </div>
          </div>

          <p className="text-[#516E7B] text-xs xs:text-sm leading-[1.5] font-medium max-w-[200px]">
            Your store is experiencing higher demand. Keep managing inventory!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
