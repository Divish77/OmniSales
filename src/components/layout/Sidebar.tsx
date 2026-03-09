import { NavLink } from "react-router-dom";
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

        <nav className="flex-1 space-y-2 w-full px-2 flex flex-col items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                title={item.name}
                className={({ isActive }) =>
                  `group flex flex-col justify-center items-center rounded-2xl w-full py-3 text-[10px] font-medium transition-all duration-300 ${isActive
                    ? "bg-white text-[#1E5769] shadow-sm transform scale-105"
                    : "text-[#A8C2CC] hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <Icon className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#1E5769]" : "text-[#A8C2CC]"}`} />
                )}
              </NavLink>
            );
          })}
        </nav>


      </div>
    </div>
  );
}
