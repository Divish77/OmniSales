import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { BarChart3, ArrowRight, TrendingUp, Target, Activity, LayoutDashboard, Database, Shield, ChevronRight } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] as any 
    } 
  }
};


const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export function LandingPage() {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax values for hero elements
  const yHeroText = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const scaleHeroImage = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans selection:bg-[#BFFF00]/30 selection:text-[#BFFF00] overflow-x-hidden">
      
      {/* Navigation - Dark & Minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-10 w-10 rounded-xl bg-[#6339F9] flex items-center justify-center shadow-[0_0_20px_rgba(99,57,249,0.4)] group-hover:scale-105 transition-transform duration-300">
              <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-[#BFFF00] transition-colors duration-300">OMNISALES</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">Log in</Link>
            <Button 
              onClick={() => navigate('/login')} 
              className="rounded-full bg-[#BFFF00] text-black hover:bg-[#a3d900] px-4 sm:px-6 py-5 sm:py-6 font-bold tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(191,255,0,0.3)] text-xs sm:text-sm"
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        
        {/* 1. HERO SECTION - Massive Typography & Purple Focus */}
        <section ref={heroRef} className="relative min-h-[80vh] sm:min-h-[90vh] flex flex-col items-center justify-center pt-10 pb-12 sm:pb-32 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[#6339F9]/20 blur-[120px] rounded-[100%] pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
            {/* Website Heading Section */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center justify-center mb-16 mt-12 relative z-30"
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-[1000] tracking-tighter text-center leading-[0.85] sm:leading-none">
                <span className="block text-[#BFFF00] filter drop-shadow-[0_0_30px_rgba(191,255,0,0.3)] sm:drop-shadow-[0_0_40px_rgba(191,255,0,0.4)] transition-all duration-500 hover:drop-shadow-[0_0_60px_rgba(191,255,0,0.6)]">
                  OMNISALES
                </span>
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-zinc-500 font-bold tracking-[0.4em] uppercase text-[10px] sm:text-xs mt-4 text-center"
              >
                The Future of Retail Intelligence
              </motion.p>
            </motion.div>

            
            <motion.div style={{ y: yHeroText }} className="text-center w-full z-10 pointer-events-none flex flex-col items-center">
              {/* Removed large OMNI background text */}
            </motion.div>

            {/* Interactive Hero Dashboard Mockup overlaying the text */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ scale: scaleHeroImage }}
              className="relative z-20 w-full max-w-5xl mt-8 sm:mt-12"

            >

              <div className="aspect-[16/9] md:aspect-[21/9] rounded-[32px] sm:rounded-[40px] border border-white/10 bg-[#121212]/80 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden p-4 sm:p-6 md:p-8 flex items-center justify-center relative group">
                {/* Simulated Dashboard UI Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6339F9]/10 to-transparent opacity-50" />
                
                <div className="w-full h-full flex gap-6 relative z-10">
                  {/* Left Sidebar Mock */}
                  <div className="hidden md:flex w-16 h-full flex-col items-center gap-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-[#6339F9] flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-full flex-1 flex flex-col items-center gap-6 py-4">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"><Activity className="w-4 h-4 text-white/40" /></div>
                      <div className="w-8 h-8 rounded-xl bg-[#BFFF00]/10 flex items-center justify-center border border-[#BFFF00]/20"><TrendingUp className="w-4 h-4 text-[#BFFF00]" /></div>
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"><Target className="w-4 h-4 text-white/40" /></div>
                    </div>
                  </div>
                  
                  {/* Main Content Area Mock */}
                  <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                    {/* Top Stats */}
                    <div className="flex gap-3 sm:gap-4 h-20 sm:h-24">
                       <div className="flex-1 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col justify-center">
                         <div className="text-zinc-500 text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Revenue</div>
                         <div className="text-lg sm:text-xl md:text-2xl font-black text-white">{format(124000, true)}</div>
                       </div>
                       <div className="flex-1 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col justify-center hidden sm:flex">

                         <div className="text-zinc-500 text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Stores</div>
                         <div className="text-lg sm:text-xl md:text-2xl font-black text-white">12</div>
                       </div>
                       <div className="flex-1 bg-[#BFFF00] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-center text-black shadow-[0_0_30px_rgba(191,255,0,0.15)]">
                         <div className="text-black/60 text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Growth</div>
                         <div className="text-lg sm:text-xl md:text-2xl font-black">+43%</div>
                       </div>
                    </div>


                    {/* Lower Section: Chart & Product Rank */}
                    <div className="flex-1 flex gap-4">
                      {/* Chart Mock */}
                      <div className="flex-[2] bg-white/5 rounded-2xl border border-white/5 p-4 sm:p-6 flex flex-col gap-4 isolate relative overflow-hidden">
                         <div className="flex justify-between items-center">
                           <span className="text-white/80 font-semibold text-sm">Revenue by Channel</span>
                           <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-[#BFFF00]"></div>
                             <div className="w-2 h-2 rounded-full bg-[#6339F9]"></div>
                           </div>
                         </div>
                         <div className="flex-1 flex items-end gap-1 sm:gap-2">
                           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                           {[30, 45, 25, 60, 40, 75, 55, 90, 65, 80, 50, 65].map((h, i) => (
                             <motion.div 
                               key={i}
                               initial={{ height: 0 }}
                               animate={{ height: `${h}%` }}
                               transition={{ delay: 0.8 + (i * 0.05), duration: 1, type: "spring" }}
                               className={`flex-1 rounded-t-sm ${i % 3 === 0 ? 'bg-[#BFFF00]' : 'bg-[#6339F9]'} relative z-10`} 
                             />
                           ))}
                         </div>
                      </div>

                      {/* Top Product Mock (Hidden on mobile) */}
                      <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-4 hidden lg:flex flex-col">
                        <span className="text-white/80 font-semibold text-sm mb-4">Top Moving SKU</span>
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="w-full h-1/2 bg-zinc-800/50 rounded-xl border border-white/5 flex items-center justify-center">
                             <div className="w-8 h-8 rounded-full bg-[#6339F9]/20 flex items-center justify-center">
                               <Shield className="w-4 h-4 text-[#6339F9]" />
                             </div>
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">Wireless Earbuds Pro</div>
                            <div className="text-[#BFFF00] font-bold text-xs mt-1">842 Units Sold</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Removed Floating Play Button as it was irrelevant to analytics */}
              </div>

            </motion.div>
            
          </div>
          
          {/* Removed glitch text overlay */}
        </section>

        {/* 2. BENTO-BOX SECTION */}
        <section id="campaign" className="py-12 sm:py-32 bg-[#0D0D0D] relative z-20">

          <div className="container mx-auto px-6 max-7xl">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
              
              {/* Left Side - The Interactive Card Stack */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="w-full lg:w-1/2 relative min-h-[500px]"
              >
                {/* Background decorative card */}
                <div className="absolute top-4 left-4 right-0 bottom-0 bg-[#6339F9]/20 rounded-[32px] rotate-3 blur-sm" />
                
                {/* Foreground Complex Card */}
                <motion.div 
                  variants={fadeIn}
                  className="absolute inset-x-0 inset-y-0 bg-[#1A1A1A] rounded-[32px] border border-white/10 p-8 shadow-2xl flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-[#6339F9] flex items-center justify-center text-white font-bold">1</div>
                    <span className="text-white font-semibold">Select Metrics</span>
                    <div className="ml-auto w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronRight className="w-5 h-5 text-white/50" /></div>
                  </div>

                  {/* Filter pills */}
                  <div className="flex gap-2 p-1.5 bg-white/5 rounded-full mb-8">
                    <div className="flex-1 py-2 rounded-full text-center text-sm font-medium text-white/50 cursor-pointer hover:text-white transition-colors">By Store</div>
                    <div className="flex-1 py-2 rounded-full bg-[#333333] text-center text-sm font-medium text-white shadow-sm cursor-pointer border border-white/10">By Product</div>
                    <div className="flex-1 py-2 rounded-full text-center text-sm font-medium text-white/50 cursor-pointer hover:text-white transition-colors">By Channel</div>
                  </div>

                  {/* The progress/slider section with neon numbers */}
                  <div className="bg-[#0D0D0D] rounded-2xl p-6 border border-white/5 mt-auto">
                    <div className="relative h-2 bg-[#333333] rounded-full mb-8">
                      <div className="absolute top-0 left-0 h-full w-[65%] bg-gradient-to-r from-[#6339F9] to-[#BFFF00] rounded-full shadow-[0_0_15px_rgba(191,255,0,0.5)]">
                        <div className="absolute -right-2 -top-2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
                          <div className="w-2 h-2 rounded-full bg-[#0D0D0D]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-4">
                      <div className="flex flex-col">
                        <span className="text-2xl sm:text-3xl font-black text-white">{format(99023, false)}</span>
                        <span className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Starting Revenue</span>
                      </div>
                      <div className="flex flex-col text-left sm:text-right">
                        <span className="text-2xl sm:text-3xl font-black text-[#BFFF00]">{format(247701, true)}+</span>
                        <span className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Forecasted Growth</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Side - Copy */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="w-full lg:w-1/2 flex flex-col justify-center"
              >
                <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-5xl font-black text-[#BFFF00] mb-6 uppercase tracking-tight leading-none">
                  Build Your Perfect <br/>
                  <span className="text-white">Growth Plan</span>
                </motion.h2>
                <motion.p variants={fadeIn} className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-lg">
                  Integrate your Point of Sale (POS) terminals with your Shopify storefronts to gain a single source of truth. Predict inventory needs, map regional demand, and increase gross margins effortlessly.
                </motion.p>
                <motion.div variants={fadeIn}>
                   <Button 
                      onClick={() => navigate('/login')}
                      className="w-full bg-[#BFFF00] text-black hover:bg-[#a3d900] py-6 font-bold rounded-2xl flex items-center justify-center gap-2 group/btn"
                    >
                      Sign up now
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
              </motion.div>
              
            </div>
          </div>
        </section>

        {/* 3. FEATURE GRID */}
        <section className="py-20 sm:py-32 bg-[#0D0D0D] border-t border-white/5 relative z-20">

          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[250px]"
            >
              {/* Massive Purple Accent Card */}
              <motion.div variants={fadeIn} className="md:col-span-2 md:row-span-2 rounded-[32px] bg-[#6339F9] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden group min-h-[400px] md:min-h-0">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
                 <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#BFFF00] flex items-center justify-center shadow-lg transform group-hover:-rotate-6 transition-transform duration-300">
                   <Target className="w-8 h-8 text-black" strokeWidth={2.5} />
                 </div>
                 <div className="relative z-10 mt-auto">
                   <h3 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight mb-4">Uncover Trends Instantly</h3>
                   <p className="text-white/80 text-lg max-w-md font-medium">Synchronize in-store POS data with e-commerce streams to spot multi-channel buying patterns earlier.</p>
                 </div>
              </motion.div>

              {/* Small Stat Card */}
              <motion.div variants={fadeIn} className="rounded-[32px] bg-[#1A1A1A] border border-white/5 p-8 flex flex-col justify-center items-center text-center group transition-colors hover:border-white/10">
                 <Shield className="w-10 h-10 text-zinc-500 group-hover:text-[#BFFF00] mb-4 transition-colors" />
                 <h4 className="text-4xl font-black text-white mb-2 tracking-tight">AES-256</h4>
                 <p className="text-zinc-400 font-medium">Bank-grade encryption</p>
              </motion.div>

              {/* Small Stat Card */}
              <motion.div variants={fadeIn} className="rounded-[32px] bg-[#1A1A1A] border border-white/5 p-8 flex flex-col justify-center items-center text-center group transition-colors hover:border-white/10">
                 <Activity className="w-10 h-10 text-zinc-500 group-hover:text-[#BFFF00] mb-4 transition-colors" />
                 <h4 className="text-4xl font-black text-white mb-2 tracking-tight">99.9%</h4>
                 <p className="text-zinc-400 font-medium">System Uptime SLA</p>
              </motion.div>

              {/* Horizontal Wide Card */}
              <motion.div variants={fadeIn} className="md:col-span-3 rounded-[32px] border border-white/10 bg-[#BFFF00] p-10 flex flex-col md:flex-row items-center justify-between overflow-hidden relative group">
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                 <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                   <h3 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight mb-2">Ready to accelerate?</h3>
                   <p className="text-black/70 font-bold text-lg">Join top performers relying on OmniSales architecture.</p>
                 </div>
                 <Button onClick={() => navigate('/login')} className="relative z-10 rounded-full h-16 w-16 bg-black flex items-center justify-center hover:scale-110 transition-transform duration-300">
                   <ArrowRight className="w-6 h-6 text-[#BFFF00]" />
                 </Button>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section className="py-20 sm:py-32 bg-[#0D0D0D] relative z-20">

          <div className="container mx-auto px-6 max-w-7xl">
            
            <div className="text-center mb-24">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4"
              >
                How It <span className="text-[#BFFF00]">Works</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-zinc-400 text-lg max-w-2xl mx-auto"
              >
                A comprehensive look at how OmniSales transforms your raw multi-channel data into actionable, predictive intelligence.
              </motion.p>
            </div>

            <div className="flex flex-col gap-32">
              
              {/* Step 1: Data Integration */}
              <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="w-full lg:w-1/2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#6339F9]/20 flex items-center justify-center mb-6 border border-[#6339F9]/50">
                    <Database className="w-8 h-8 text-[#6339F9]" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">1. Sync Everywhere</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                    Connect your physical retail Point of Sale (POS) systems seamlessly with your online Shopify, WooCommerce, or Amazon storefronts. OmniSales acts as a central nervous system, aggregating inventory and transaction data in real-time.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-zinc-300 font-medium"><div className="w-2 h-2 rounded-full bg-[#BFFF00]"/> Real-time inventory deduction</li>
                    <li className="flex items-center gap-3 text-zinc-300 font-medium"><div className="w-2 h-2 rounded-full bg-[#BFFF00]"/> Standardized data schemas</li>
                    <li className="flex items-center gap-3 text-zinc-300 font-medium"><div className="w-2 h-2 rounded-full bg-[#BFFF00]"/> Automated error correction</li>
                  </ul>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="w-full lg:w-1/2 aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden relative group border border-white/10"
                >
                  <div className="absolute inset-0 bg-[#6339F9]/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-multiply" />
                  <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=2070" alt="Tech Data Integration" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </motion.div>

              </div>
              {/* Step 2: AI Forecasting */}
              <div className="flex flex-col-reverse lg:flex-row-reverse items-center gap-12 lg:gap-16">
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="w-full lg:w-1/2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#BFFF00]/20 flex items-center justify-center mb-6 border border-[#BFFF00]/50">
                    <TrendingUp className="w-8 h-8 text-[#BFFF00]" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">2. Predictive AI Models</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                    Once data is unified, our proprietary machine learning algorithms analyze historical sales patterns against current market velocities. We automatically forecast when you will run out of stock and predict revenue trajectories for individual SKUs.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-zinc-300 font-medium"><div className="w-2 h-2 rounded-full bg-[#6339F9]"/> 90-Day rolling forecasts</li>
                    <li className="flex items-center gap-3 text-zinc-300 font-medium"><div className="w-2 h-2 rounded-full bg-[#6339F9]"/> Seasonal trend adjustments</li>
                    <li className="flex items-center gap-3 text-zinc-300 font-medium"><div className="w-2 h-2 rounded-full bg-[#6339F9]"/> Dead-stock prevention alerts</li>
                  </ul>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -50, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="w-full lg:w-1/2 aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden relative group border border-white/10"
                >
                  <div className="absolute inset-0 bg-[#BFFF00]/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-multiply" />
                  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" alt="Data Analytics Dashboard" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </motion.div>
              </div>

              {/* Step 3: Actionable Dashboards */}
              <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="w-full lg:w-1/2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 border border-zinc-600">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">3. Command Center</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                    A beautiful, hyper-responsive Command Center visualizes everything. Rather than staring at complex spreadsheets, interact directly with geographical demand maps, category performance donuts, and top-product leaderboards designed specifically for operators.
                  </p>
                  <Button onClick={() => navigate('/login')} className="rounded-full bg-[#6339F9] text-white hover:bg-[#502cd4] px-8 py-6 font-bold tracking-wide mt-4">
                    Get Started Now
                  </Button>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="w-full lg:w-1/2 aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden relative group border border-white/10"
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img src="https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=2094" alt="Business Operations View" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </motion.div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* FOOTER - Minimal, Stark Contrast */}
      <footer className="bg-[#0D0D0D] py-16 border-t border-white/10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-black" strokeWidth={3} />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-white">OMNISALES</span>
            </div>
            
            <div className="flex gap-6">
              <span className="text-zinc-500 font-semibold hover:text-[#BFFF00] cursor-pointer transition-colors duration-200">X (TWITTER)</span>
              <span className="text-zinc-500 font-semibold hover:text-[#BFFF00] cursor-pointer transition-colors duration-200">LINKEDIN</span>
              <span className="text-zinc-500 font-semibold hover:text-[#BFFF00] cursor-pointer transition-colors duration-200">INSTAGRAM</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-8 text-sm font-medium text-zinc-600">
            <p>&copy; {new Date().getFullYear()} OmniSales Analytics. All rights reserved.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
