import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BarChart3, Users, TrendingUp, Sparkles, PlusCircle } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales Analytics", href: "/sales", icon: BarChart3 },
  { name: "Customer Behavior", href: "/behavior", icon: Users },
  { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "Add Sale", href: "/add-sale", icon: PlusCircle },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex flex-col fixed inset-y-0 left-4 z-50 py-4 w-[110px]">
      <div className="flex flex-col items-center flex-grow glass-card rounded-[30px] shadow-sm overflow-y-auto py-8 px-2 h-full bg-[#3B5B68] border-[#4A6672] dark:bg-slate-900/80">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-md">
            <BarChart3 className="h-6 w-6 text-[#1E5769]" />
          </div>
        </div>

        <nav className="flex-1 space-y-4 w-full px-2 flex flex-col items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                title={item.name}
                className={({ isActive }) =>
                  `group relative flex flex-col justify-center items-center rounded-2xl w-full py-4 transition-all duration-300 ${isActive
                    ? "text-[#1E5769]"
                    : "text-[#A8C2CC] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-white/50"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 30,
                            mass: 0.8
                          }}
                        />
                      )}
                    </AnimatePresence>
                    
                    <motion.div
                      animate={{ 
                        scale: isActive ? 1.15 : 1,
                        y: isActive ? -2 : 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 25 
                      }}
                      className="relative z-10"
                    >
                      <Icon className={`h-6 w-6 flex-shrink-0 ${isActive ? "text-[#1E5769]" : "text-[#A8C2CC]"}`} />
                    </motion.div>
                    
                    {!isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
