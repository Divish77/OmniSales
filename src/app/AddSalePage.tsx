import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Store, Globe, Plus, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";

type Channel = "store" | "online";

const CATEGORIES = ["Electronics", "Furniture", "Sports", "Books", "Health", "Beauty", "Home", "Office", "Fashion", "Food"];

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Other"];

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  store_name: "",
  product_name: "",
  category: "",
  quantity: "",
  price: "",
  location: "",
};

type RecentEntry = {
  id: string;
  date: string;
  product_name: string;
  category: string;
  quantity: number;
  price: number;
  channel: Channel;
};

export function AddSalePage() {
  const [channel, setChannel] = useState<Channel>("store");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecent = async () => {
    setLoadingRecent(true);
    const [storeRes, onlineRes] = await Promise.all([
      supabase.from("store_sales").select("id,date,product_name,category,quantity,price").order("created_at", { ascending: false }).limit(5),
      supabase.from("online_sales").select("id,date,product_name,category,quantity,price").order("created_at", { ascending: false }).limit(5),
    ]);
    const storeSales = (storeRes.data ?? []).map(r => ({ ...r, channel: "store" as Channel }));
    const onlineSales = (onlineRes.data ?? []).map(r => ({ ...r, channel: "online" as Channel }));
    const merged = [...storeSales, ...onlineSales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
    setRecent(merged);
    setLoadingRecent(false);
  };

  useEffect(() => { loadRecent(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.store_name || !form.product_name || !form.category || !form.quantity || !form.price || !form.location) {
      setErrorMsg("Please fill in all fields, including Store Name.");
      setStatus("error");
      return;
    }
    if (Number(form.quantity) <= 0 || Number(form.price) <= 0) {
      setErrorMsg("Quantity and price must be greater than zero.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    const table = channel === "store" ? "store_sales" : "online_sales";
    const locField = channel === "store" ? "city" : "location";
    const payload = {
      date: form.date,
      store_name: form.store_name,
      product_name: form.product_name,
      category: form.category,
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price),
      [locField]: form.location,
    };

    const { error } = await supabase.from(table).insert(payload);
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
      return;
    }

    setStatus("success");
    setForm({ ...emptyForm, date: form.date, category: form.category, location: form.location });
    loadRecent();
    setTimeout(() => setStatus("idle"), 3000);
  };

  const deleteEntry = async (id: string, ch: Channel) => {
    const table = ch === "store" ? "store_sales" : "online_sales";
    await supabase.from(table).delete().eq("id", id);
    loadRecent();
  };

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Add Sale</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Record a new sale from your store or online channel. It will appear in your analytics instantly.
        </p>
      </motion.div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-5">
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-3">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>New Sale Entry</CardTitle>
              {/* Channel toggle */}
              <div className="flex gap-2 mt-3">
                {(["store", "online"] as Channel[]).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      channel === ch
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {ch === "store" ? <Store className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    {ch === "store" ? "Physical Store" : "Online Sale"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Store Name — full width, required */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {channel === "store" ? "Store Name" : "Platform / Brand Name"}
                    <span className="text-red-500 text-base leading-none">*</span>
                  </label>
                  <Input
                    name="store_name"
                    placeholder={channel === "store" ? "e.g. Divish Electronics — Andheri Branch" : "e.g. Amazon, Flipkart, My Website"}
                    value={form.store_name}
                    onChange={handleChange}
                    className={`bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 ${
                      status === "error" && !form.store_name ? "border-red-400 focus:ring-red-400" : ""
                    }`}
                  />
                </div>

                {/* Date + Product */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                    <Input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Name</label>
                    <Input
                      name="product_name"
                      placeholder="e.g. Nike Running Shoes"
                      value={form.product_name}
                      onChange={handleChange}
                      className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Category + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {channel === "store" ? "City / Store Location" : "Region / Market"}
                    </label>
                    <select
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                      className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price per Unit (USD)</label>
                    <Input
                      type="number"
                      name="price"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 49.99"
                      value={form.price}
                      onChange={handleChange}
                      className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Revenue preview */}
                {form.quantity && form.price && (
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                      ${(Number(form.quantity) * Number(form.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Status feedback */}
                <AnimatePresence>
                  {status === "success" && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-4 py-3 text-green-700 dark:text-green-400 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      Sale recorded successfully! The dashboard will update shortly.
                    </motion.div>
                  )}
                  {status === "error" && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />{errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl h-11 font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200"
                >
                  {status === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" />Record Sale</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent entries */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader><CardTitle>Recent Entries</CardTitle></CardHeader>
            <CardContent>
              {loadingRecent
                ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
                : recent.length === 0
                  ? <p className="text-center text-slate-400 text-sm py-8">No entries yet. Add your first sale!</p>
                  : (
                    <div className="space-y-2">
                      {recent.map(r => (
                        <div key={`${r.channel}-${r.id}`}
                          className="flex items-start gap-3 rounded-xl px-3 py-2.5 bg-white/40 dark:bg-white/5 border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all group">
                          <div className={`mt-0.5 h-7 w-7 flex-shrink-0 rounded-lg flex items-center justify-center ${r.channel === "online" ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-purple-50 dark:bg-purple-500/10"}`}>
                            {r.channel === "online"
                              ? <Globe className="h-3.5 w-3.5 text-indigo-500" />
                              : <Store className="h-3.5 w-3.5 text-purple-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.product_name}</p>
                            <p className="text-xs text-slate-400">{r.category} · {r.date} · ×{r.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              ${(r.quantity * r.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <button
                              onClick={() => deleteEntry(r.id, r.channel)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
