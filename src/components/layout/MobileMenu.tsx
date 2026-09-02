import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, BarChart3, Users, TrendingUp, Sparkles, PlusCircle } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales Analytics", href: "/sales", icon: BarChart3 },
  { name: "Customer Behavior", href: "/behavior", icon: Users },
  { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "Add Sale", href: "/add-sale", icon: PlusCircle },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="md:hidden flex h-12 w-12 items-center justify-center rounded-[20px]
            bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] 
            border border-slate-100 dark:border-slate-700/50
            text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="h-6 w-6 stroke-[2]" />
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        }
      />
      <SheetContent side="left" className="bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700/50 w-72 p-0">
        <div className="flex h-16 items-center px-6 mb-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-white dark:bg-slate-700 flex items-center justify-center shadow-[0_8px_20px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-600">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">OmniSales</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/dashboard"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-[16px] px-4 py-3 text-sm font-semibold transition-all duration-300 border ${
                    isActive
                      ? "bg-white dark:bg-slate-700 shadow-[0_8px_25px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgb(0,0,0,0.2)] border-slate-100 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 stroke-[2] ${isActive ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`} />
                    {item.name}
                    {item.href === "/insights" && (
                      <span className="ml-auto text-[10px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">AI</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
