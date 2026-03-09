import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, LogOut, Shield, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Force reload to trigger login screen
  };

  const user = session?.user;
  const provider = user?.app_metadata?.provider || "email";

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile and application preferences.
        </p>
      </motion.div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-3">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" /> My Profile
              </h3>
            </div>
            <div className="p-6 space-y-6 bg-white/50 dark:bg-slate-950/50">
              
              <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm flex-shrink-0">
                  <User className="h-10 w-10 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {user?.user_metadata?.full_name || "OmniSales User"}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Account ID
                  </h4>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                    {user?.id}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" /> Sign-in Method
                  </h4>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {provider}
                  </p>
                </div>
              </div>

              {!user?.email_confirmed_at && provider === "email" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-500">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Email Verification Pending</h4>
                    <p className="text-sm opacity-90">Please check your email to verify your account. Unverified accounts may lose access.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>

        {/* Actions Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-1 border-none shadow-none">
          <div className="space-y-4">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all gap-2"
            >
              <LogOut className="h-5 w-5" /> Sign Out
            </Button>
            <p className="text-xs text-center text-slate-500">
              You will be redirected to the login page.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
