import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, UserCircle, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold
          bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/40
          backdrop-blur-sm text-slate-700 dark:text-slate-200
          hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all duration-200 shadow-sm"
      >
        <span className="text-base leading-none">{currency.symbol}</span>
        <span className="hidden sm:inline">{currency.code}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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

function PageIndicator() {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <AnimatePresence>
      {isDashboard && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            mass: 0.8
          }}
          className="flex items-center gap-2.5 rounded-2xl px-4 py-2 
            bg-white/5 dark:bg-slate-800/40 border border-white/20 dark:border-white/10
            backdrop-blur-xl shadow-xl shadow-indigo-500/5 group group"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full"
            />
            <LayoutDashboard className="h-4 w-4 text-indigo-400 relative z-10" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">
            Dashboard
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-[70px] sm:h-[86px] lg:h-[100px] items-center justify-between px-3 sm:px-6
      bg-transparent transition-all duration-300">

      <div className="flex items-center gap-8">
        <MobileMenu />
      </div>

      <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
        <PageIndicator />
      </div>

      <div className="flex items-center gap-6">

        {/* Currency Selector */}
        <CurrencySelector />

        <div className="flex items-center gap-2">


          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
