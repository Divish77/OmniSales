import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, TrendingUp } from "lucide-react";
import type { RegionalDemand } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

interface GeographicMapProps {
  data: RegionalDemand[];
  loading: boolean;
}

export function GeographicMap({ data, loading }: GeographicMapProps) {
  const { format } = useCurrency();

  return (
    <Card className="glass-card border-0 bg-white relative overflow-hidden h-full min-h-[260px] xs:min-h-[270px] sm:min-h-[280px] flex flex-col">
      <CardHeader className="pb-1.5 xs:pb-2 z-10 relative shrink-0">
        <CardTitle className="text-sm xs:text-base font-semibold text-slate-800">Targeting by region</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 relative px-2.5 xs:px-3 pb-2.5 xs:pb-3 flex flex-col z-10 min-h-0">
        {/* Abstract Map Background using basic CSS shapes to simulate a world map briefly */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-1 p-8 items-center justify-center overflow-hidden">
            {Array.from({length: 150}).map((_, i) => (
               <div key={i} className={`w-2 h-2 rounded-full bg-slate-800 ${Math.random() > 0.6 ? 'opacity-0' : 'opacity-100'}`} />
            ))}
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[150px]">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 mt-2 overflow-y-auto pr-1">
            {data.slice(0, 5).map((region, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm hover:bg-slate-50 transition-colors shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-teal-50/80 rounded-lg flex items-center justify-center text-teal-600 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{region.region}</h4>
                    <p className="text-xs text-slate-500 font-medium truncate">Top: {region.top_category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-bold text-slate-800">{format(region.revenue)}</div>
                  <div className="text-[10px] text-teal-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3" /> {region.units_sold} units
                  </div>
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 min-h-[150px]">
                No regional data available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
