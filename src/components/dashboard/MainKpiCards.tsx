import { motion } from "framer-motion";
import { ShoppingBag, Eye, Loader2, TrendingUp } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface MainKpiCardsProps {
  totalRevenue: number;
  totalOrders: number;
  loading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as any
    }
  }
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as any
  }
};

export function MainKpiCards({ totalRevenue, totalOrders, loading }: MainKpiCardsProps) {
  const { format } = useCurrency();
  
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 grid-cols-1 sm:grid-cols-3"
    >
      {/* Large KPI Card - Revenue */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -8, scale: 1.005, transition: { duration: 0.3 } }}
        className="lg:col-span-2 bg-[#1A1A1A] rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl border border-white/5 relative overflow-hidden h-full min-h-[240px] group active:scale-[0.99]"
      >
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <h3 className="text-white/50 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] drop-shadow-sm">
                Omnichannel Revenue
              </h3>
              <div className="h-[2.5px] w-10 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
            <motion.div 
              animate={floatAnimation}
              className="bg-[#2D1B4E] p-4 rounded-3xl shadow-xl shadow-purple-900/40 border border-purple-400/30"
            >
              <Eye className="w-6 h-6 text-indigo-300" />
            </motion.div>
          </div>
          
          <div className="flex items-start gap-1 mt-auto">
            <span className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-none drop-shadow-2xl">
              {format(totalRevenue)}
            </span>
          </div>
          
          <div className="flex justify-between items-end mt-8">
            <div className="text-white/40 text-xs sm:text-sm font-bold tracking-tight">
              Total Across All Channels
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2 group-hover:bg-white/10 transition-all hover:scale-105">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-white font-black text-xs tracking-tight">+12.5%</span>
            </div>
          </div>
        </div>

        {/* Premium Purplish Background Effects */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_60%)] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.6\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
        
        {/* Glossy Highlight */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </motion.div>

      {/* Small KPI Card - Orders */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -8, scale: 1.01, transition: { duration: 0.3 } }}
        className="bg-[#1A1A1A] rounded-[32px] flex flex-col shadow-2xl border border-white/5 relative overflow-hidden h-full group active:scale-[0.99]"
      >
        <div className="p-6 sm:p-8 flex-1 flex flex-col h-full relative z-10 bg-[#1A1A1A]/40 backdrop-blur-[1px]">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <h3 className="text-white/50 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] drop-shadow-sm">Total Orders</h3>
              <div className="h-[2.5px] w-10 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </div>
            <motion.div 
              animate={floatAnimation}
              className="bg-[#3D1F0E] p-4 rounded-3xl shadow-xl shadow-orange-950/40 border border-orange-500/30"
            >
              <ShoppingBag className="w-5 h-5 text-orange-300" strokeWidth={2.5} />
            </motion.div>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-none drop-shadow-2xl">
                {totalOrders.toLocaleString()}
              </span>
              <div className="text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 shadow-lg shadow-orange-950/20">
                +12%
              </div>
            </div>

            <p className="text-white/40 text-sm leading-[1.5] font-bold mt-4">
              Higher demand <span className="text-white font-black">detected</span>.
            </p>
          </div>
        </div>
        
        {/* Premium Orangish Background Effects */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.2),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.1),transparent_60%)] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-orange-600/25 blur-[90px] rounded-full pointer-events-none" />
        
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.6\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
        
        {/* Glossy Highlight */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}
