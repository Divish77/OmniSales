import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/app/Dashboard";
import { Login } from "@/app/Login";
import { SalesAnalyticsPage } from "@/app/SalesAnalyticsPage";
import { CustomerBehaviorPage } from "@/app/CustomerBehaviorPage";
import { ForecastsPage } from "@/app/ForecastsPage";
import { AIInsightsPage } from "@/app/AIInsightsPage";
import { AddSalePage } from "@/app/AddSalePage";
import { LandingPage } from "@/app/LandingPage";
import { supabase } from "@/lib/supabase";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { BackgroundMesh } from "@/components/ui/BackgroundMesh";
import type { Session } from "@supabase/supabase-js";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <Routes location={location}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesAnalyticsPage />} />
          <Route path="/behavior" element={<CustomerBehaviorPage />} />
          <Route path="/forecasts" element={<ForecastsPage />} />
          <Route path="/insights" element={<AIInsightsPage />} />
          <Route path="/add-sale" element={<AddSalePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  return (
    <>
      <ScrollProgress />
      <BackgroundMesh />
      <div className="flex w-full max-w-full bg-transparent min-h-screen transition-colors duration-300 relative overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 w-full md:w-auto md:ml-[142px] px-3 sm:px-6 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 w-full max-w-full pb-10">
            <AnimatedRoutes />
          </main>
        </div>
      </div>
    </>
  );
}

import { FilterProvider } from "@/context/FilterContext";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <CurrencyProvider>
      <FilterProvider>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={!session ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/login" 
              element={!session ? <Login onLogin={() => {}} /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/*" 
              element={session ? <AppLayout /> : <Navigate to="/" replace />} 
            />
          </Routes>
        </BrowserRouter>
      </FilterProvider>
    </CurrencyProvider>
  );
}

export default App;
