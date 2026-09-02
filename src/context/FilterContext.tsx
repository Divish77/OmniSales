import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export type DatePreset =
  | 'last30'
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'single'
  | 'custom';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  last30:      'Last 30 Days',
  today:       'Today',
  yesterday:   'Yesterday',
  last7:       'Last 7 Days',
  thisWeek:    'This Week',
  lastWeek:    'Last Week',
  thisMonth:   'This Month',
  lastMonth:   'Last Month',
  thisQuarter: 'This Quarter',
  lastQuarter: 'Last Quarter',
  thisYear:    'This Year',
  lastYear:    'Last Year',
  single:      'Single Date',
  custom:      'Custom Range',
};

/** Format a local Date as YYYY-MM-DD without timezone shift */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Calculate start/end dates for a given preset (in local timezone) */
export function calcPresetRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function fmt(d: Date) { return toLocalDateStr(d); }

  switch (preset) {
    case 'today': {
      const s = fmt(today);
      return { startDate: s, endDate: s };
    }
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      const s = fmt(y);
      return { startDate: s, endDate: s };
    }
    case 'last7': {
      const s = new Date(today); s.setDate(s.getDate() - 6);
      return { startDate: fmt(s), endDate: fmt(today) };
    }
    case 'last30': {
      const s = new Date(today); s.setDate(s.getDate() - 29);
      return { startDate: fmt(s), endDate: fmt(today) };
    }
    case 'thisWeek': {
      const dow = today.getDay(); // 0=Sun
      const s = new Date(today); s.setDate(s.getDate() - dow);
      return { startDate: fmt(s), endDate: fmt(today) };
    }
    case 'lastWeek': {
      const dow = today.getDay();
      const e = new Date(today); e.setDate(e.getDate() - dow - 1);
      const s = new Date(e); s.setDate(s.getDate() - 6);
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    case 'thisMonth': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: fmt(s), endDate: fmt(today) };
    }
    case 'lastMonth': {
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(firstOfThisMonth); e.setDate(e.getDate() - 1);
      const s = new Date(e.getFullYear(), e.getMonth(), 1);
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    case 'thisQuarter': {
      const q = Math.floor(today.getMonth() / 3);
      const s = new Date(today.getFullYear(), q * 3, 1);
      return { startDate: fmt(s), endDate: fmt(today) };
    }
    case 'lastQuarter': {
      const q = Math.floor(today.getMonth() / 3);
      const prevQ = q === 0 ? 3 : q - 1;
      const prevQYear = q === 0 ? today.getFullYear() - 1 : today.getFullYear();
      const s = new Date(prevQYear, prevQ * 3, 1);
      const e = new Date(prevQYear, prevQ * 3 + 3, 0); // last day of prevQ
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    case 'thisYear': {
      const s = new Date(today.getFullYear(), 0, 1);
      return { startDate: fmt(s), endDate: fmt(today) };
    }
    case 'lastYear': {
      const s = new Date(today.getFullYear() - 1, 0, 1);
      const e = new Date(today.getFullYear() - 1, 11, 31);
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    default:
      return { startDate: fmt(today), endDate: fmt(today) };
  }
}

interface FilterContextType {
  // Geography / product filters
  selectedCountry: string;
  setSelectedCountry: (val: string) => void;
  selectedState: string;
  setSelectedState: (val: string) => void;
  selectedProduct: string;
  setSelectedProduct: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;

  // Month filter (kept for legacy API compatibility — YYYY-MM or '')
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;

  // New: centralized date range
  datePreset: DatePreset;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  setDateRange: (preset: DatePreset, start?: string, end?: string) => void;

  // Reset everything to defaults
  resetAllFilters: () => void;
}

const DEFAULT_PRESET: DatePreset = 'last30';
const DEFAULT_RANGE = calcPresetRange(DEFAULT_PRESET);

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const [datePreset, setDatePreset] = useState<DatePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState<string>(DEFAULT_RANGE.startDate);
  const [endDate, setEndDate] = useState<string>(DEFAULT_RANGE.endDate);

  const setDateRange = useCallback((preset: DatePreset, start?: string, end?: string) => {
    setDatePreset(preset);
    if (preset === 'single' || preset === 'custom') {
      // Validate: start must not be after end
      const s = start ?? startDate;
      const e = end ?? endDate;
      if (s <= e) {
        setStartDate(s);
        setEndDate(e);
      } else {
        // swap if inverted
        setStartDate(e);
        setEndDate(s);
      }
      // Also derive selectedMonth for legacy APIs
      if (s) {
        setSelectedMonth(s.substring(0, 7)); // YYYY-MM
      }
    } else {
      const range = calcPresetRange(preset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
      // Derive selectedMonth from endDate for legacy APIs
      setSelectedMonth(range.endDate.substring(0, 7));
    }
  }, [startDate, endDate]);

  const resetAllFilters = useCallback(() => {
    setSelectedCountry('');
    setSelectedState('');
    setSelectedProduct('');
    setSelectedCategory('');
    setSelectedMonth('');
    setDatePreset(DEFAULT_PRESET);
    setStartDate(DEFAULT_RANGE.startDate);
    setEndDate(DEFAULT_RANGE.endDate);
  }, []);

  const value = useMemo(() => ({
    selectedCountry, setSelectedCountry,
    selectedState,   setSelectedState,
    selectedProduct, setSelectedProduct,
    selectedCategory, setSelectedCategory,
    selectedMonth,   setSelectedMonth,
    datePreset, startDate, endDate, setDateRange,
    resetAllFilters,
  }), [
    selectedCountry, selectedState, selectedProduct, selectedCategory, selectedMonth,
    datePreset, startDate, endDate, setDateRange, resetAllFilters,
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilters must be used within a FilterProvider');
  }
  return context;
}
