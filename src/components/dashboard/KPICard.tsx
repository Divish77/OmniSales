import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  metric: string;
  trend: string;
  icon: LucideIcon;
  delay?: number;
}

export function KPICard({ title, metric, trend, icon: Icon, delay = 0 }: KPICardProps) {
  const isPositive = trend.startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="glass-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-indigo-500/20">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div
              className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 shadow-sm ${
                isPositive
                  ? "bg-green-100/80 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                  : "bg-red-100/80 text-red-800 dark:bg-red-500/20 dark:text-red-400"
              }`}
            >
              {trend}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              {title}
            </h3>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-blue-600 dark:group-hover:from-indigo-400 dark:group-hover:to-blue-400 transition-all duration-300">
              {metric}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
