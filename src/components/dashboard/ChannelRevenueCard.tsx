import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MonitorSmartphone, Loader2 } from "lucide-react";
import type { ChannelRevenue } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

interface ChannelRevenueCardProps {
  data: ChannelRevenue[];
  loading: boolean;
}

export function ChannelRevenueCard({ data, loading }: ChannelRevenueCardProps) {
  const { format } = useCurrency();

  return (
    <Card className="glass-card border-0 bg-white relative overflow-hidden h-full min-h-[280px] flex flex-col">
      <CardHeader className="pb-2 z-10 relative shrink-0">
        <CardTitle className="text-base font-semibold text-slate-800">Channel Performance</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 relative flex flex-col p-3 pt-0 justify-center z-10 w-full min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[150px]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full h-full overflow-y-auto pr-1 pb-1">
             {data.map((channel, idx) => {
               const isOnline = channel.channel.toLowerCase() === 'online';
               return (
                <div key={idx} className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4 flex flex-col shadow-sm relative overflow-hidden shrink-0">
                  {/* Subtle background glow based on channel */}
                  <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${isOnline ? 'bg-indigo-500' : 'bg-emerald-500'}`} />

                  <div className="flex items-center gap-3 mb-3 z-10">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        isOnline 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {isOnline ? <MonitorSmartphone className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-wide">{channel.channel}</h4>
                      <p className="text-xs text-slate-500 font-medium">Sales Channel</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-auto z-10">
                    <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-100/50">
                       <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Revenue</p>
                       <p className="text-sm font-bold text-slate-800">{format(channel.revenue)}</p>
                    </div>
                     <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-100/50">
                       <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Orders</p>
                       <p className="text-sm font-bold text-slate-800">{channel.orders.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 bg-white rounded-lg p-2 flex items-center justify-between shadow-sm border border-slate-100/50">
                       <p className="text-xs text-slate-500 font-medium">Avg. Order Value</p>
                       <p className="text-xs font-bold text-slate-700">{format(channel.avg_order_value)}</p>
                    </div>
                  </div>
                </div>
               );
             })}

             {data.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 min-h-[150px]">
                No channel data available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
