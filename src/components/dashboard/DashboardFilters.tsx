import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Filter, MapPin, Globe, PackageSearch, X, LayoutTemplate, CalendarDays, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES as APP_CATEGORIES } from "@/app/AddSalePage";
import { useGlobalFilters } from "@/context/FilterContext";
import type { DatePreset } from "@/context/FilterContext";
import { DATE_PRESET_LABELS, calcPresetRange, toLocalDateStr } from "@/context/FilterContext";

type CountryRegion = { country: string; region: string };

interface FilterSelectProps {
  icon: any;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  loading?: boolean;
  displayMap?: Record<string, string>;
}

function FilterSelect({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  loading = false,
  displayMap
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const label = displayMap ? displayMap[opt] : opt;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayValue = value ? (displayMap ? displayMap[value] : (value.charAt(0).toUpperCase() + value.slice(1))) : "";

  return (
    <div className="relative group flex-1 focus-within:z-50" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>

      <input
        type="text"
        placeholder={loading ? "Loading..." : placeholder}
        disabled={loading}
        value={isOpen ? searchTerm : displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="block w-full pl-10 pr-10 py-2.5 text-sm bg-white/50 dark:bg-slate-800/50
          border border-slate-200 dark:border-slate-700/50 rounded-xl
          text-slate-900 dark:text-slate-100 placeholder-slate-400
          focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
          transition-all duration-300 disabled:opacity-50
          hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-sm relative z-0"
      />

      {value && !isOpen && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(""); setSearchTerm(""); }}
          className="absolute inset-y-0 right-8 pr-1 flex items-center z-10 text-slate-400 hover:text-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-slate-800/95
              border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl
              max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-md"
          >
            {(!searchTerm || placeholder.toLowerCase().includes(searchTerm.toLowerCase())) && (
              <div
                onClick={() => { onChange(""); setIsOpen(false); setSearchTerm(""); }}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors
                  ${!value ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                `}
              >
                {placeholder}
              </div>
            )}

            {filteredOptions.map((opt) => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(""); }}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors
                  ${value === opt ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                `}
              >
                {displayMap ? displayMap[opt] : (opt.charAt(0).toUpperCase() + opt.slice(1))}
              </div>
            ))}

            {filteredOptions.length === 0 && !(!searchTerm || placeholder.toLowerCase().includes(searchTerm.toLowerCase())) && (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No results found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Date Range Picker ──────────────────────────────────────────────────────────

const QUICK_PRESETS: { preset: DatePreset; label: string }[] = [
  { preset: 'today',       label: 'Today' },
  { preset: 'yesterday',   label: 'Yesterday' },
  { preset: 'last7',       label: 'Last 7 Days' },
  { preset: 'last30',      label: 'Last 30 Days' },
  { preset: 'thisWeek',    label: 'This Week' },
  { preset: 'lastWeek',    label: 'Last Week' },
  { preset: 'thisMonth',   label: 'This Month' },
  { preset: 'lastMonth',   label: 'Last Month' },
  { preset: 'thisQuarter', label: 'This Quarter' },
  { preset: 'lastQuarter', label: 'Last Quarter' },
  { preset: 'thisYear',    label: 'This Year' },
  { preset: 'lastYear',    label: 'Last Year' },
];

function DateRangePicker() {
  const { datePreset, startDate, endDate, setDateRange } = useGlobalFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const [mode, setMode] = useState<'presets' | 'single' | 'custom'>('presets');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync local inputs when global state changes
  useEffect(() => {
    setCustomStart(startDate);
    setCustomEnd(endDate);
  }, [startDate, endDate]);

  const isDefault = datePreset === 'last30';

  const displayLabel = (() => {
    if (datePreset === 'single') return `${startDate}`;
    if (datePreset === 'custom') return `${startDate} → ${endDate}`;
    return DATE_PRESET_LABELS[datePreset];
  })();

  const handlePresetClick = (preset: DatePreset) => {
    setDateRange(preset);
    setIsOpen(false);
    setMode('presets');
  };

  const handleSingleApply = () => {
    if (!customStart) return;
    setDateRange('single', customStart, customStart);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    const s = customStart <= customEnd ? customStart : customEnd;
    const e = customStart <= customEnd ? customEnd : customStart;
    setDateRange('custom', s, e);
    setIsOpen(false);
  };

  const handleReset = () => {
    setDateRange('last30');
    setIsOpen(false);
    setMode('presets');
  };

  const today = toLocalDateStr(new Date());

  return (
    <div className="relative flex-1 focus-within:z-50" ref={wrapperRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 pl-3 pr-3 py-2.5 text-sm rounded-xl border transition-all duration-300 backdrop-blur-sm
          ${!isDefault
            ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
      >
        <CalendarDays className={`h-4 w-4 flex-shrink-0 ${!isDefault ? 'text-indigo-500' : 'text-slate-400'}`} />
        <span className="flex-1 text-left truncate text-sm">{displayLabel}</span>
        {!isDefault && (
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            className="text-indigo-400 hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[200] top-full mt-1.5 right-0 w-80 bg-white/98 dark:bg-slate-900/98 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            {/* Mode tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              {(['presets', 'single', 'custom'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize
                    ${mode === m
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  {m === 'presets' ? 'Quick Select' : m === 'single' ? 'Single Date' : 'Custom Range'}
                </button>
              ))}
            </div>

            {/* Presets grid */}
            {mode === 'presets' && (
              <div className="p-3 grid grid-cols-2 gap-1.5">
                {QUICK_PRESETS.map(({ preset, label }) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all
                      ${datePreset === preset
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Single date */}
            {mode === 'single' && (
              <div className="p-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  max={today}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
                <button
                  onClick={handleSingleApply}
                  disabled={!customStart}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/25"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Custom range */}
            {mode === 'custom' && (
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || today}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    max={today}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                {customStart && customEnd && customStart > customEnd && (
                  <p className="text-xs text-red-500 font-medium">Start date must be before end date.</p>
                )}
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd || customStart > customEnd}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/25"
                >
                  Apply Range
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {startDate === endDate ? startDate : `${startDate} → ${endDate}`}
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold transition-colors"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main DashboardFilters Component ───────────────────────────────────────────

export function DashboardFilters() {
  const {
    selectedCountry, setSelectedCountry,
    selectedState, setSelectedState,
    selectedProduct, setSelectedProduct,
    selectedCategory, setSelectedCategory,
    datePreset,
    resetAllFilters,
  } = useGlobalFilters();

  const [countries, setCountries] = useState<string[]>([]);
  const [allStates, setAllStates] = useState<CountryRegion[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile expand state
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const { data, error } = await supabase.rpc("get_filter_options");
        if (data && !error && data.length > 0) {
          const row = data[0];
          setCountries(row.countries || []);
          setAllStates(row.regions || []);
          setProducts(row.products || []);
          const mergedCat = Array.from(new Set([...(row.categories || []), ...APP_CATEGORIES])).sort();
          setCategories(mergedCat);
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOptions();
  }, []);

  const hasGeoFilter = selectedCountry || selectedState || selectedProduct || selectedCategory;
  const hasDateFilter = datePreset !== 'last30';
  const hasAnyFilter = hasGeoFilter || hasDateFilter;

  const availableStates = selectedCountry
    ? allStates.filter(s => s.country === selectedCountry).map(s => s.region)
    : allStates.map(s => s.region);
  const uniqueAvailableStates = Array.from(new Set(availableStates)).sort();

  // Clear state selection when country changes and state is no longer valid
  useEffect(() => {
    if (selectedState && uniqueAvailableStates.length > 0 && !uniqueAvailableStates.includes(selectedState)) {
      setSelectedState("");
    }
  }, [uniqueAvailableStates, selectedState, setSelectedState]);

  return (
    <div className="w-full relative z-[60]">
      {/* Mobile Toggle */}
      <div className="sm:hidden mb-4 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60
          border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium
          text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-md"
        >
          <Filter className="w-4 h-4" />
          {isOpen ? "Hide Filters" : "Show Filters"}
          {hasAnyFilter && !isOpen && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {(isOpen || (typeof window !== 'undefined' && window.innerWidth >= 640)) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-visible"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center bg-white/40 dark:bg-slate-900/40
              p-3 sm:p-2 sm:px-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="hidden sm:flex items-center gap-2 pl-2 pr-4 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Filter className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters</span>
              </div>

              <div className="flex w-full flex-col sm:flex-row gap-2 flex-1 flex-wrap sm:flex-nowrap">
                {/* Date Range Picker — always first */}
                <DateRangePicker />

                <FilterSelect
                  icon={Globe}
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  options={countries}
                  loading={loading}
                  placeholder="All Countries"
                />

                <FilterSelect
                  icon={MapPin}
                  value={selectedState}
                  onChange={setSelectedState}
                  options={uniqueAvailableStates}
                  loading={loading}
                  placeholder="All States/Regions"
                />

                <FilterSelect
                  icon={PackageSearch}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  options={products}
                  loading={loading}
                  placeholder="All Products"
                />

                <FilterSelect
                  icon={LayoutTemplate}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categories}
                  loading={loading}
                  placeholder="All Categories"
                />
              </div>

              {hasAnyFilter && (
                <div className="w-full sm:w-auto flex justify-end flex-shrink-0">
                  <button
                    onClick={resetAllFilters}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 w-full sm:w-auto
                      text-xs sm:text-sm font-medium text-red-600 dark:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
