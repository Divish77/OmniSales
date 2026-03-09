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
        className="flex items-center justify-center gap-1 xs:gap-1.5 rounded-lg xs:rounded-xl px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold min-h-[44px] min-w-[44px]
          bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/40
          backdrop-blur-sm text-slate-700 dark:text-slate-200
          hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-200 shadow-sm"
      >
        <span className="text-sm xs:text-base leading-none">{currency.symbol}</span>
        <span className="hidden xs:inline">{currency.code}</span>
        <ChevronDown className={`h-3 xs:h-3.5 w-3 xs:w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/30 dark:border-slate-700/40
          bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden">
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
    <div ref={ref} className="relative ml-1 hidden sm:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white/50 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <UserCircle className="h-6 w-6" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/30 dark:border-slate-700/40
          bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 z-50 overflow-hidden">
          
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

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-[60px] xs:h-[70px] sm:h-[86px] lg:h-[100px] items-center justify-between px-2.5 xs:px-3 sm:px-6
      bg-transparent transition-all duration-300">

      <div className="flex items-center gap-2 xs:gap-3 sm:gap-8">
        <MobileMenu />
      </div>

      <div className="flex items-center gap-2 xs:gap-4 sm:gap-6">
        {/* Currency Selector */}
        <CurrencySelector />

        <div className="flex items-center gap-2 xs:gap-2">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
