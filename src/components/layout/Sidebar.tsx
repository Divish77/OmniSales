import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, Users, TrendingUp, Sparkles, Settings, User, PlusCircle } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales Analytics", href: "/sales", icon: BarChart3 },
  { name: "Customer Behavior", href: "/behavior", icon: Users },
  { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "Add Sale", href: "/add-sale", icon: PlusCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col lg:w-72 fixed inset-y-0 left-0 z-50">
      <div className="flex flex-col flex-grow glass shadow-none rounded-r-2xl border-l-0 overflow-y-auto pt-6 px-4 pb-4 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient tracking-tight">OmniSales</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 shadow-sm border border-white/20 dark:border-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                    {item.name}
                    {item.href === "/insights" && (
                      <span className="ml-auto text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full px-1.5 py-0.5 font-semibold">AI</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-6 border-t border-slate-200/20 dark:border-slate-800/20">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200/50">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">Divish Admin</span>
              <span className="text-xs text-slate-500 truncate">omnisales.app</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
