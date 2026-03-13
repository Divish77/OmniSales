import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Plus, Loader2, CheckCircle2, AlertCircle, ShoppingCart, 
  Globe, Store, Trash2, Tag, MapPin 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyContext";

const CATEGORIES = ["Electronics", "Fashion", "Home & Garden", "Sports", "Beauty", "Automotive"];
const CITIES = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"];

interface SaleEntry {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
  channel: 'online' | 'store';
}

export function AddSalePage() {
  const [form, setForm] = useState({
    product_name: "",
    category: "",
    quantity: "",
    price: "",
    location: "",
  });
  const [channel, setChannel] = useState<'online' | 'store'>('online');
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [recent, setRecent] = useState<SaleEntry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const { currency, format } = useCurrency();

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      const { data: online, error: e1 } = await supabase.from('sales_data').select('*').order('sale_date', { ascending: false }).limit(5);
      const { data: store, error: e2 } = await supabase.from('store_sales').select('*').order('sale_date', { ascending: false }).limit(5);
      
      if (e1 || e2) throw e1 || e2;

      const combined: SaleEntry[] = [
        ...(online || []).map(s => ({ ...s, id: s.sale_id, channel: 'online', date: s.sale_date })),
        ...(store || []).map(s => ({ ...s, id: s.sale_id, channel: 'store', date: s.sale_date }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10) as SaleEntry[];

      setRecent(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some(v => !v)) {
      setErrorMsg("Please fill in all fields.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const payload = {
        product_name: form.product_name,
        category: form.category,
        quantity: parseInt(form.quantity),
        price: parseFloat(form.price),
        sale_date: new Date().toISOString().split('T')[0],
      };

      const table = channel === "online" ? "sales_data" : "store_sales";
      const locationKey = channel === "online" ? "region" : "city";
      
      const { error } = await supabase.from(table).insert([{ ...payload, [locationKey]: form.location }]);
      
      if (error) throw error;

      setStatus("success");
      setForm({ product_name: "", category: "", quantity: "", price: "", location: "" });
      fetchRecent();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record sale.");
      setStatus("error");
    }
  };

  const deleteEntry = async (id: string, ch: 'online' | 'store') => {
    const table = ch === "online" ? "sales_data" : "store_sales";
    const { error } = await supabase.from(table).delete().eq('sale_id', id);
    if (!error) fetchRecent();
  };

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Record New Sale</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manually enter a transaction to keep your dashboard and AI models updated with the latest data.</p>
      </motion.div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-3">
          <Card className="glass-card shadow-lg border-slate-200/60 dark:border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-indigo-500" /> Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Channel Toggle */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setChannel("online")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${channel === "online" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Globe className="h-4 w-4" /> Online Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("store")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${channel === "store" ? "bg-white dark:bg-slate-700 shadow-sm text-purple-600" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Store className="h-4 w-4" /> Physical Store
                  </button>
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Name</label>
                  <Input
                    name="product_name"
                    placeholder="e.g. Wireless Headphones Z1"
                    value={form.product_name}
                    onChange={handleChange}
                    className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                  />
                </div>

                {/* Category + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-tight text-[10px] flex items-center gap-1.5">
                       <MapPin className="h-3 w-3" /> {channel === "store" ? "City / Store Location" : "Region / Market"}
                    </label>
                    <select
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="">Select location…</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Quantity + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity Sold</label>
                    <Input
                      type="number"
                      name="quantity"
                      min="1"
                      placeholder="e.g. 3"
                      value={form.quantity}
                      onChange={handleChange}
                      className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price per Unit ({currency.code})</label>
                    <Input
                      type="number"
                      name="price"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 49.99"
                      value={form.price}
                      onChange={handleChange}
                      className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                    />
                  </div>
                </div>

                {/* Revenue preview */}
                {form.quantity && form.price && (
                  <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-5 py-4 flex items-center justify-between shadow-inner">
                    <span className="text-sm text-indigo-700 dark:text-indigo-300 font-semibold tracking-wide uppercase text-[11px]">Est. Total Revenue</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 tracking-tighter">
                      {format(Number(form.quantity) * Number(form.price))}
                    </span>
                  </div>
                )}

                {/* Status feedback */}
                <AnimatePresence>
                  {status === "success" && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      Sale recorded successfully! The dashboard will update shortly.
                    </motion.div>
                  )}
                  {status === "error" && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium font-mono lowercase">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />{errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all duration-300 active:scale-[0.98]"
                >
                  {status === "loading" ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing Transaction…</>
                  ) : (
                    <><Plus className="h-5 w-5 mr-2" />Complete Record Sale</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent entries */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2">
          <Card className="glass-card h-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-lg font-bold">Recent Ledger</CardTitle>
               <div className="bg-slate-100 p-1.5 rounded-lg"><Tag className="w-4 h-4 text-slate-400" /></div>
            </CardHeader>
            <CardContent>
              {loadingRecent
                ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
                : recent.length === 0
                  ? <p className="text-center text-slate-400 text-sm py-12 font-medium">No sales recorded yet.</p>
                  : (
                    <div className="space-y-3">
                      {recent.map(r => (
                        <div key={`${r.channel}-${r.id}`}
                          className="flex items-start gap-4 rounded-2xl px-4 py-4 bg-white/60 dark:bg-white/5 border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
                          <div className={`mt-0.5 h-11 w-11 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm ${r.channel === "online" ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-50" : "bg-purple-50 dark:bg-purple-500/10 border border-purple-50"}`}>
                            {r.channel === "online"
                              ? <Globe className="h-5 w-5 text-indigo-500" />
                              : <Store className="h-5 w-5 text-purple-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{r.product_name}</p>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-tight">{r.category} · {r.date} · {r.quantity} units</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap tracking-tighter">
                              {format(r.quantity * r.price, true)}
                            </span>
                            <button
                              onClick={() => deleteEntry(r.id, r.channel)}
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
