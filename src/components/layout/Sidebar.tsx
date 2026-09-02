import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BarChart3, Users, TrendingUp, Sparkles, PlusCircle } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales Analytics", href: "/sales", icon: BarChart3 },
  { name: "Customer Behavior", href: "/behavior", icon: Users },
  { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "Add Sale", href: "/add-sale", icon: PlusCircle },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex flex-col fixed inset-y-0 left-4 z-50 py-4 w-[110px]">
      <div className="flex flex-col items-center flex-grow rounded-[30px] overflow-y-auto py-8 px-2 h-full bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-700/50">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="h-12 w-12 rounded-[20px] bg-white dark:bg-slate-700 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-600">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <nav className="flex-1 space-y-4 w-full px-2 flex flex-col items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/dashboard"}
                title={item.name}
                className={({ isActive }) =>
                  `group relative flex flex-col justify-center items-center rounded-[20px] w-12 h-12 mx-auto my-2 transition-all duration-300 ${isActive
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-white dark:bg-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-600 rounded-[20px]"
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
                      <Icon className={`h-6 w-6 stroke-[2] flex-shrink-0 ${isActive ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`} />
                    </motion.div>
                    
                    {!isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-slate-50 dark:bg-slate-700/50 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity"
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
