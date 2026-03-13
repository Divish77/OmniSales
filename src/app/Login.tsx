import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Mail, Lock, User, ArrowRight, 
  Loader2, Github, CheckCircle2, Phone, Key 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface AuthProps {
  onLogin: () => void;
}

export function Login({ onLogin }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | null>(null);
  
  // Modes: "login", "signup", "reset_phone", "reset_verify"
  const [mode, setMode] = useState<"login" | "signup" | "reset_phone" | "reset_verify">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGithubSignIn = async () => {
    setOauthLoading("github");
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        
        if (data?.session === null && data?.user?.identities?.length) {
          setErrorMsg("Check your email to verify your account before logging in.");
          setIsLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLogin();
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else if (mode === "reset_phone") {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setMode("reset_verify");
        setErrorMsg("OTP sent! Please check your messages.");
      } else if (mode === "reset_verify") {
        const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
        if (error) throw error;
        
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;
        onLogin();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignUp = mode === "signup";
  const isReset = mode === "reset_phone" || mode === "reset_verify";

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex w-1/2 relative bg-indigo-600 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-lg text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight">OmniSales</span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Actionable insights for growing brands.
            </h2>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Join thousands of retailers using OmniSales to track performance, predict trends, and optimize conversion.
            </p>
            <div className="space-y-4">
              {["Real-time revenue monitoring", "Advanced customer segmentation", "Automated weekly reporting"].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center gap-3 text-indigo-50">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  <span className="font-medium text-sm">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {isSignUp ? "Create an account" : isReset ? "Reset password" : "Log in to your account"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isSignUp ? "Start your 14-day free trial today." : isReset ? "We'll send you a recovery code." : "Welcome back! Please enter your details."}
            </p>
          </div>

          {!isReset && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="w-full h-11 justify-center gap-2 font-medium bg-white dark:bg-slate-900 dark:border-slate-800"
                  type="button"
                  disabled={oauthLoading !== null}
                  onClick={handleGithubSignIn}
                >
                  {oauthLoading === "github" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="h-4 w-4" />
                  )}
                  Continue with GitHub
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 dark:bg-slate-950 px-2 text-slate-500">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {errorMsg && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${errorMsg.includes("OTP sent") ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-500/30 dark:text-green-400" : "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-400"}`}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-11" required={isSignUp} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isReset ? (
              <>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required />
                </div>

                {!isSignUp && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600" />
                      <span className="text-slate-600 dark:text-slate-400">Remember me</span>
                    </label>
                    <button type="button" onClick={() => { setMode("reset_phone"); setErrorMsg(null); }} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            ) : mode === "reset_phone" ? (
              <motion.div key="phone-field" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11" required />
                </div>
              </motion.div>
            ) : (
              <motion.div key="verify-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="pl-10 h-11" required />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-11" required />
                </div>
              </motion.div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
              <AnimatePresence mode="wait">
                {isLoading
                  ? <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="h-5 w-5 animate-spin mx-auto text-white" /></motion.div>
                  : <motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                      {isSignUp ? "Create account" : mode === "reset_phone" ? "Send code" : mode === "reset_verify" ? "Reset password" : "Sign in"} <ArrowRight className="h-4 w-4" />
                    </motion.div>
                }
              </AnimatePresence>
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {!isReset ? (
              <>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={() => { setMode(isSignUp ? "login" : "signup"); setErrorMsg(null); }} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setMode("login"); setErrorMsg(null); }} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Back to Sign In
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
