import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/app/Dashboard";
import { Login } from "@/app/Login";
import { SalesAnalyticsPage } from "@/app/SalesAnalyticsPage";
import { CustomerBehaviorPage } from "@/app/CustomerBehaviorPage";
import { ForecastsPage } from "@/app/ForecastsPage";
import { AIInsightsPage } from "@/app/AIInsightsPage";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

function AppLayout() {
  return (
    <div className="flex bg-slate-50 dark:bg-transparent min-h-screen transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 lg:ml-72 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<SalesAnalyticsPage />} />
            <Route path="/behavior" element={<CustomerBehaviorPage />} />
            <Route path="/forecasts" element={<ForecastsPage />} />
            <Route path="/insights" element={<AIInsightsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

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

  if (!session) return <Login onLogin={() => {}} />;

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
