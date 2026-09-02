import { useState, useEffect, useRef } from "react";
import { ChevronDown, UserCircle, LogOut } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { useCurrency, CURRENCIES, type CurrencyInfo } from "@/context/CurrencyContext";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-12 px-4 rounded-[20px] text-sm font-semibold
          bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] 
          border border-slate-100 dark:border-slate-700/50
          text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="text-base leading-none">{currency.symbol}</span>
        <span className="hidden sm:inline">{currency.code}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/30 dark:border-slate-700/40
          bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-slate-900/10 z-[80] overflow-hidden">
          <div className="p-1.5">
            {CURRENCIES.map((c: CurrencyInfo) => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150
                  ${currency.code === c.code
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 text-base text-center">{c.symbol}</span>
                  <span>{c.name}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const user = session?.user;
  const provider = user?.app_metadata?.provider || "email";

  return (
    <div ref={ref} className="relative ml-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-[20px]
          bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] 
          border border-slate-100 dark:border-slate-700/50
          text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <UserCircle className="h-6 w-6 stroke-[2]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/30 dark:border-slate-700/40
          bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 z-[80] overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {user?.user_metadata?.full_name || "OmniSales User"}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
            <div className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 inline-block capitalize">
              {provider} Account
            </div>
          </div>

          <div className="p-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function HeaderContent() {
  return (
    <div className="flex items-center gap-3">
      <CurrencySelector />
      <ProfileDropdown />
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-[70] flex h-[70px] sm:h-[86px] lg:h-[100px] items-center justify-between px-3 sm:px-6
      bg-transparent transition-all duration-300">

      <div className="flex items-center gap-8">
        <MobileMenu />
      </div>


      <div className="flex items-center gap-6">
        <HeaderContent />
      </div>
    </header>
  );
}
