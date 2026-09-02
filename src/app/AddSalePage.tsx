import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Plus, Loader2, CheckCircle2, AlertCircle, ShoppingCart, 
  Globe, Store, Trash2, Tag, Upload, FileCode, X, MapPin 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyContext";
import * as XLSX from "xlsx";
export const CATEGORIES = [
  "Accessories",
  "Automotive",
  "Books",
  "Clothing",
  "Electronics",
  "Fashion & Apparel",
  "Furniture",
  "Groceries",
  "Health & Beauty",
  "Home & Kitchen",
  "Home Appliances",
  "Industrial & Tools",
  "Jewelry & Watches",
  "Office Supplies",
  "Pet Supplies",
  "Sports & Outdoors",
  "Toys & Games"
];

const COUNTRY_DATA: Record<string, string[]> = {
  "India": ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"],
  "United States": ["California", "Texas", "New York", "Florida", "Illinois", "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island"],
  "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"],
  "Germany": ["Bavaria", "North Rhine-Westphalia", "Baden-Württemberg", "Berlin", "Hesse", "Lower Saxony", "Saxony", "Rhineland-Palatinate"],
  "France": ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Grand Est", "Provence-Alpes-Côte d'Azur"],
  "Japan": ["Tokyo", "Osaka", "Kanagawa", "Aichi", "Saitama", "Chiba", "Hyōgo", "Hokkaido", "Fukuoka", "Shizuoka"],
  "China": ["Guangdong", "Jiangsu", "Shandong", "Zhejiang", "Henan", "Sichuan", "Hubei", "Fujian", "Hunan", "Shanghai", "Beijing"],
  "Brazil": ["São Paulo", "Minas Gerais", "Rio de Janeiro", "Bahia", "Paraná", "Rio Grande do Sul", "Pernambuco", "Ceará"],
};

interface SaleEntry {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
  channel: 'online' | 'store';
  store_name?: string;
}

export function AddSalePage() {
  const [form, setForm] = useState({
    product_name: "",
    category: "",
    quantity: "",
    price: "",
    store_name: "",
    country: "India",
    location: "",
    customCountry: "",
    customLocation: "",
  });
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [channel, setChannel] = useState<'online' | 'store'>('online');
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
      const { data: online, error: e1 } = await supabase.from('online_sales').select('*').order('sale_date', { ascending: false }).limit(5);
      const { data: store, error: e2 } = await supabase.from('store_sales').select('*').order('sale_date', { ascending: false }).limit(5);
      
      if (e1 || e2) throw e1 || e2;

      const combined: SaleEntry[] = [
        ...(online || []).map(s => ({ ...s, id: s.sale_id, channel: 'online', date: s.sale_date, store_name: s.store_name })),
        ...(store || []).map(s => ({ ...s, id: s.sale_id, channel: 'store', date: s.sale_date, store_name: s.store_name }))
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
    const currentCountry = form.country === "Custom Location" ? form.customCountry : form.country;
    const currentRegion = (form.country === "Custom Location" || form.location === "Custom Location") ? form.customLocation : form.location;

    if (Object.values({
      pn: form.product_name,
      cat: form.category,
      q: form.quantity,
      p: form.price,
      c: currentCountry,
      loc: currentRegion,
    }).some(v => !v)) {
      setErrorMsg("Please fill in all fields, including location details.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const payload = {
        product_name: form.product_name,
        category: form.category,
        quantity: parseInt(form.quantity),
        price: parseFloat(form.price) / currency.rate,
        store_name: form.store_name,
        country: currentCountry,
        region: currentRegion,
        sale_date: new Date().toISOString().split('T')[0],
      };

      const table = channel === "online" ? "online_sales" : "store_sales";

      // Prevent Data Redundancy: Check if this exact transaction already exists
      const { data: existing } = await supabase.from(table)
        .select('sale_id')
        .eq('product_name', payload.product_name)
        .eq('category', payload.category)
        .eq('quantity', payload.quantity)
        .eq('country', payload.country)
        .eq('region', payload.region)
        .eq('sale_date', payload.sale_date)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error("Duplicate entry detected! This exact transaction was already recorded.");
      }

      const { error } = await supabase.from(table).insert([payload]);

      if (error) throw error;

      // Trigger AI Engines to rebuild insights and forecasts based on the new data
      await supabase.rpc('generate_ai_insights_engine');
      await supabase.rpc('generate_analytics_insights_engine');
      await supabase.rpc('generate_forecast_engine');

      setStatus("success");
      setForm({ ...form, product_name: "", category: "", quantity: "", price: "", store_name: "", customCountry: "", customLocation: "", location: "" });
      fetchRecent();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record sale.");
      setStatus("error");
    }
  };

  const deleteEntry = async (id: string, ch: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const table = ch === "online" ? "online_sales" : "store_sales";
    const { error } = await supabase.from(table).delete().eq('sale_id', id);
    if (!error) {
      // Trigger AI Engines to recalculate insights and forecasts
      await supabase.rpc('generate_ai_insights_engine');
      await supabase.rpc('generate_analytics_insights_engine');
      await supabase.rpc('generate_forecast_engine');
      fetchRecent();
    }
  };

  const handlePurgeSpecificDate = async () => {
    const defaultDate = new Date().toISOString().split('T')[0];
    const targetDate = window.prompt("Enter the exact date to delete all data (Format: YYYY-MM-DD):", defaultDate);
    
    if (!targetDate) return;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      alert("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }

    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ALL sales data recorded on ${targetDate}?`)) return;
    
    setIsProcessing(true);
    setStatus("loading");
    try {
      await supabase.from("online_sales").delete().eq("sale_date", targetDate);
      await supabase.from("store_sales").delete().eq("sale_date", targetDate);
      await supabase.from("harmonized_sales").delete().eq("sale_date", targetDate);

      // Trigger AI Engines to rebuild insights and forecasts
      await supabase.rpc('generate_ai_insights_engine');
      await supabase.rpc('generate_analytics_insights_engine');
      await supabase.rpc('generate_forecast_engine');

      setStatus("success");
      alert(`All records for ${targetDate} were deleted successfully.`);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to purge data for the specific date.");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeSpecificProduct = async () => {
    const targetProduct = window.prompt("Enter the exact name of the Product to delete its data:");
    
    if (!targetProduct || targetProduct.trim() === "") return;
    
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ALL sales records for the product "${targetProduct}"?`)) return;
    
    setIsProcessing(true);
    setStatus("loading");
    try {
      await supabase.from("online_sales").delete().ilike("product_name", `%${targetProduct}%`);
      await supabase.from("store_sales").delete().ilike("product_name", `%${targetProduct}%`);
      await supabase.from("harmonized_sales").delete().ilike("product_name", `%${targetProduct}%`);

      // Trigger AI Engines to rebuild insights and forecasts
      await supabase.rpc('generate_ai_insights_engine');
      await supabase.rpc('generate_analytics_insights_engine');
      await supabase.rpc('generate_forecast_engine');

      setStatus("success");
      alert(`All records for product matching "${targetProduct}" were deleted successfully.`);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to purge data for the specific product.");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeAllData = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete ALL sales data in the entire database? This action cannot be undone.")) return;
    
    const challenge = prompt("Type 'DELETE EVERYTHING' to confirm total database wipe:");
    if (challenge !== "DELETE EVERYTHING") {
      alert("Database wipe cancelled. You did not type the exact confirmation phrase.");
      return;
    }
    
    setIsProcessing(true);
    setStatus("loading");
    try {
      await supabase.from("online_sales").delete().gte("sale_date", "2000-01-01");
      await supabase.from("store_sales").delete().gte("sale_date", "2000-01-01");
      await supabase.from("harmonized_sales").delete().gte("sale_date", "2000-01-01");

      await supabase.rpc('generate_ai_insights_engine');
      await supabase.rpc('generate_analytics_insights_engine');
      await supabase.rpc('generate_forecast_engine');

      setStatus("success");
      alert("Complete database wipe successful.");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to wipe entire database.");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws);
      
      const normalizedData = rawData.map((row: any) => {
        const normalized: any = {};
        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          // Smart partial matching for headers like "Price (in USD)" or "Store (Optional)"
          if (lowerKey.includes("product")) normalized.product_name = value;
          else if (lowerKey.includes("category")) normalized.category = value;
          else if (lowerKey.includes("quantity") || lowerKey.includes("qty")) normalized.quantity = value;
          else if (lowerKey.includes("price")) normalized.price = value;
          else if (lowerKey.includes("store")) normalized.store_name = value;
          else if (lowerKey.includes("country")) normalized.country = value;
          else if (lowerKey.includes("region") || lowerKey.includes("state")) normalized.region = value;
          else if (lowerKey.includes("date")) normalized.date = value;
          else if (lowerKey.includes("channel")) normalized.channel = value;
          else normalized[key] = value;
        }
        return normalized;
      });
      
      setBulkRows(normalizedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkRows.length === 0) return;
    setIsProcessing(true);
    setStatus("loading");

    try {
      const onlinePayload: any[] = [];
      const storePayload: any[] = [];

      bulkRows.forEach(row => {
        const rowChannelStr = (row.channel || row.Channel || "").toString().toLowerCase();
        
        let targetTable = channel === "online" ? "online_sales" : "store_sales";
        if (rowChannelStr.includes("store") || rowChannelStr.includes("physical")) {
          targetTable = "store_sales";
        } else if (rowChannelStr.includes("online")) {
          targetTable = "online_sales";
        }

        const formattedRow = {
          product_name: row.product_name || row.Product || "",
          category: row.category || row.Category || "",
          quantity: parseInt(row.quantity || row.Quantity || 0),
          price: parseFloat(row.price || row.Price || 0) / currency.rate,
          store_name: row.store_name || row.Store || "",
          country: row.country || row.Country || "Unknown",
          region: row.region || row.state || row.Region || row.State || "Unknown",
          sale_date: row.date || row.Date || new Date().toISOString().split('T')[0],
        };

        if (targetTable === "online_sales") {
          onlinePayload.push(formattedRow);
        } else {
          storePayload.push(formattedRow);
        }
      });

      if (onlinePayload.length > 0) {
        const { error } = await supabase.from("online_sales").insert(onlinePayload);
        if (error) throw error;
      }
      
      if (storePayload.length > 0) {
        const { error } = await supabase.from("store_sales").insert(storePayload);
        if (error) throw error;
      }

      // Trigger AI Engines to evaluate newly inserted bulk data
      await supabase.rpc('generate_ai_insights_engine');
      await supabase.rpc('generate_analytics_insights_engine');
      await supabase.rpc('generate_forecast_engine');

      setStatus("success");
      setBulkRows([]);
      fetchRecent();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process bulk upload.");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6 w-full">
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
              <div className="space-y-6">
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-6 py-3 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'manual' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Manual Entry
                  {activeTab === 'manual' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`px-6 py-3 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'bulk' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Bulk Upload
                  {activeTab === 'bulk' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
              </div>

              <div className="space-y-6">
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

                {activeTab === 'manual' ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store / Seller Name</label>
                        <Input
                          name="store_name"
                          placeholder="e.g. Amazon India / Downtown Store"
                          value={form.store_name}
                          onChange={handleChange}
                          className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                        />
                      </div>
                    </div>

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

                {/* Location Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Country
                    </label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={(e) => {
                        setForm(prev => ({ 
                          ...prev, 
                          country: e.target.value, 
                          location: "",
                          customCountry: e.target.value === "Custom Location" ? prev.customCountry : "",
                          customLocation: ""
                        }));
                      }}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="">Select country…</option>
                      {Object.keys(COUNTRY_DATA).sort().map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Custom Location">Other / Enter Manually</option>
                    </select>
                    {form.country === "Custom Location" && (
                      <Input
                        name="customCountry"
                        placeholder="Enter custom country..."
                        value={form.customCountry}
                        onChange={handleChange}
                        className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> State / City
                    </label>
                    {form.country !== "Custom Location" && form.country ? (
                      <select
                        name="location"
                        value={form.location}
                        onChange={(e) => {
                          setForm(prev => ({
                            ...prev,
                            location: e.target.value,
                            customLocation: e.target.value === "Custom Location" ? prev.customLocation : ""
                          }));
                        }}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      >
                        <option value="">Select state/region…</option>
                        {(COUNTRY_DATA[form.country] || []).map(l => <option key={l} value={l}>{l}</option>)}
                        <option value="Custom Location">Other / Enter Manually</option>
                      </select>
                    ) : (
                      <Input
                        name="customLocation"
                        placeholder="Enter state/city..."
                        value={form.customLocation}
                        onChange={handleChange}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    )}
                    
                    {form.location === "Custom Location" && form.country !== "Custom Location" && (
                      <Input
                        name="customLocation"
                        placeholder="Enter custom state/city..."
                        value={form.customLocation}
                        onChange={handleChange}
                        className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                      />
                    )}
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
                      {format((Number(form.quantity) * Number(form.price)) / currency.rate)}
                    </span>
                  </div>
                )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForm({ product_name: "", category: "", quantity: "", price: "", store_name: "", country: "India", location: "", customCountry: "", customLocation: "" })}
                        className="w-1/3 min-w-[120px] rounded-xl h-14 font-bold text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 transition-all border-2 border-slate-200 dark:border-slate-800"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Clear
                      </Button>
                      <Button
                        type="submit"
                        disabled={status === "loading"}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all duration-300 active:scale-[0.98]"
                      >
                        {status === "loading" ? (
                          <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing…</>
                        ) : (
                          <><Plus className="h-5 w-5 mr-2" />Complete Record</>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-all bg-slate-50/50 dark:bg-slate-900/20 relative">
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Sales Spreadsheet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mx-auto">
                          Drag and drop your .xlsx or .csv file here to bulk record transactions.
                        </p>
                      </div>
                    </div>

                    <div className="bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700/50 rounded-2xl p-5 text-sm space-y-3 mt-4">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Required Spreadsheet Format</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Ensure your file contains the following column headers (case-insensitive):
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md">Product</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md">Category</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md">Quantity</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md text-indigo-600 dark:text-indigo-400 font-bold border-indigo-200 dark:border-indigo-800">Price (in {currency.code})</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md">Country</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md">Region/State</span>
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 shadow-sm rounded-md text-indigo-700 dark:text-indigo-300 opacity-90 font-semibold">Channel (Optional)</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md opacity-70">Store (Optional)</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md opacity-70">Date (Optional)</span>
                      </div>
                    </div>

                    {bulkRows.length > 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-5 w-5 text-indigo-500" />
                            <span className="font-bold text-slate-900 dark:text-white">{bulkRows.length} Transactions Detected</span>
                          </div>
                          <button onClick={() => setBulkRows([])} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">
                              <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Store</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {bulkRows.slice(0, 10).map((row, i) => (
                                <tr key={i} className="text-slate-700 dark:text-slate-300">
                                  <td className="px-4 py-3 font-bold truncate max-w-[120px]">{row.product_name || row.Product}</td>
                                  <td className="px-4 py-3">{row.quantity || row.Quantity}</td>
                                  <td className="px-4 py-3">{format((row.price || row.Price || 0) / currency.rate)}</td>
                                  <td className="px-4 py-3 truncate max-w-[100px]">{row.store_name || row.Store}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {bulkRows.length > 10 && (
                            <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/30 text-slate-400 font-medium">
                              + {bulkRows.length - 10} more records...
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleBulkSubmit}
                          disabled={isProcessing}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                          {isProcessing ? (
                            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing Bulk Data…</>
                          ) : (
                            <><CheckCircle2 className="h-5 w-5 mr-2" />Confirm & Upload Records</>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Status feedback */}
                <AnimatePresence>
                  {status === "success" && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      Status update: All transactions recorded successfully!
                    </motion.div>
                  )}
                  {status === "error" && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium font-mono lowercase">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />{errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <div className="mt-8 border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <h4 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2">
                   <AlertCircle className="w-5 h-5" /> Danger Zone: Manual DB Cleanup
                 </h4>
                 <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-1">
                   Use these options to securely clear corrupted uploads or completely wipe the database history.
                 </p>
               </div>
               <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                 <Button 
                   onClick={handlePurgeSpecificDate}
                   disabled={isProcessing}
                   className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 h-10 px-5 font-bold tracking-wide transition-all"
                 >
                   {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                   Wipe Data by Date
                 </Button>
                  <Button 
                    onClick={handlePurgeSpecificProduct}
                    disabled={isProcessing}
                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 h-10 px-4 font-bold tracking-wide transition-all"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Wipe by Product
                  </Button>
                  <Button 
                    onClick={handlePurgeAllData}
                   disabled={isProcessing}
                   variant="outline"
                   className="border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl h-10 px-5 font-bold tracking-wide transition-all"
                 >
                   <Trash2 className="w-4 h-4 mr-2" /> Wipe DB
                 </Button>
               </div>
             </div>
          </div>
        </motion.div>

        {/* Recent entries */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2 relative min-h-[400px]">
          <div className="absolute inset-0">
            <Card className="glass-card h-full flex flex-col shadow-sm border border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
                 <CardTitle className="text-lg font-bold">Recent Ledger</CardTitle>
                 <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg"><Tag className="w-4 h-4 text-slate-400" /></div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 pr-2 pb-4">
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
                              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-tight">
                                {r.category} · {r.date} · {r.quantity} units {r.store_name && `· ${r.store_name}`}
                              </p>
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
