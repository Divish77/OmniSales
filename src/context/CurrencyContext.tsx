import { createContext, useContext, useState, type ReactNode } from "react";

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "JPY" | "AED" | "SGD" | "CAD" | "AUD";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // relative to USD
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$",  name: "US Dollar",         rate: 1       },
  { code: "INR", symbol: "₹",  name: "Indian Rupee",      rate: 83.5    },
  { code: "EUR", symbol: "€",  name: "Euro",              rate: 0.918   },
  { code: "GBP", symbol: "£",  name: "British Pound",     rate: 0.787   },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen",      rate: 149.2   },
  { code: "AED", symbol: "د.إ",name: "UAE Dirham",        rate: 3.672   },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar",  rate: 1.342   },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar",   rate: 1.357   },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.527   },
];

type CurrencyContextType = {
  currency: CurrencyInfo;
  setCurrency: (c: CurrencyInfo) => void;
  format: (usdAmount: number, compact?: boolean) => string;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyInfo>(CURRENCIES[0]); // default USD

  const format = (usdAmount: number, compact = false): string => {
    const converted = usdAmount * currency.rate;
    if (compact) {
      if (converted >= 1_000_000) return `${currency.symbol}${(converted / 1_000_000).toFixed(1)}M`;
      if (converted >= 1_000)     return `${currency.symbol}${(converted / 1_000).toFixed(1)}K`;
    }
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
