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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 min-h-[200px]">
        <div className="lg:col-span-2 glass-card bg-pastel-blue-teal rounded-[30px] flex items-center justify-center border-0 shadow-sm relative overflow-hidden">
          <Loader2 className="h-10 w-10 animate-spin text-white/50" />
        </div>
        <div className="glass-card bg-pastel-peach-beige rounded-[30px] flex items-center justify-center shadow-sm border-0 relative overflow-hidden">
          <Loader2 className="h-10 w-10 animate-spin text-orange-400/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {/* Large KPI Card - Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2 glass-card bg-pastel-blue-teal rounded-[40px] p-5 sm:p-7 flex flex-col shadow-sm border-0 relative overflow-hidden h-full min-h-[240px]"
      >
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <h3 className="text-white text-lg font-medium opacity-90 mb-2">Total Revenue</h3>
          
          <div className="flex items-start gap-1 mb-6 mt-1">
            <span className="text-3xl font-bold text-white/70 mt-2">$</span>
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-none">
              {totalRevenue.toLocaleString()}
            </span>
          </div>
          
          <div className="flex gap-8 mt-2">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-full"><Eye className="w-3 h-3 text-white/80" /></div>
              <div>
                <div className="text-white/60 text-xs font-medium">Views</div>
                <div className="text-white font-bold text-base leading-tight">24.5k</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-full"><Activity className="w-3 h-3 text-white/80" /></div>
              <div>
                <div className="text-white/60 text-xs font-medium">Conversion</div>
                <div className="text-white font-bold text-base leading-tight">3.2%</div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-5">
            <button 
              onClick={() => navigate('/sales')} 
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] flex items-center shadow-xl transition-all group w-fit border border-white/10"
            >
              View full statistic 
              <ChevronRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
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
        className="glass-card bg-pastel-peach-beige rounded-[40px] flex flex-col shadow-sm border-0 relative overflow-hidden h-full group"
      >
        <div className="p-5 sm:p-7 flex-1">
          <div className="flex justify-between items-start mb-7">
            <h3 className="text-[#13313D] text-xl font-bold tracking-tight">Total Orders</h3>
            <div className="bg-white p-2.5 rounded-2xl border border-white shadow-sm flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="text-5xl font-black tracking-tighter text-[#13313D] leading-none">
              {totalOrders.toLocaleString()}
            </span>
            <div className="bg-white/90 text-[#059669] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-white shadow-sm flex items-center h-fit mt-1">
              +12%
            </div>
          </div>

          <p className="text-[#516E7B] text-sm leading-[1.5] font-medium pr-4">
            Your store is experiencing higher demand. <span className="text-[#13313D] font-black">Keep managing</span> inventory to fulfill all orders!
          </p>
        </div>

        {/* Footer Section */}
        <div className="mt-auto px-5 pb-5">
          <div className="w-full h-[1px] bg-[#E5E9EB]/50 mb-4" />
          <button className="w-full flex items-center justify-between group/footer">
            <div className="flex items-center gap-3">
              <div className="text-xl">📦</div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-[#516E7B] group-hover:text-[#13313D] transition-colors leading-tight">
                  View all pending and <br /> shipped orders.
                </p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-[#13313D] group-hover:bg-[#13313D] transition-all bg-white shadow-sm">
              <ChevronRight className="w-4 h-4 text-[#13313D] group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
