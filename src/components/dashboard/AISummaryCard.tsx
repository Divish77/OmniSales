import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchRecommendations, type Recommendation } from "@/lib/api";
import { useGlobalFilters } from "@/context/FilterContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function AISummaryCard() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { selectedCountry, selectedState, selectedProduct, selectedCategory } = useGlobalFilters();

  useEffect(() => {
    setLoading(true);
    fetchRecommendations(selectedCountry, selectedState, selectedProduct, selectedCategory)
      .then(recs => {
        if (recs && recs.length > 0) {
          const topRec = recs.find(r => r.impact_level === "high") || recs[0];
          setRecommendation(topRec);
        } else {
          setRecommendation(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCountry, selectedState, selectedProduct, selectedCategory]);

  if (!loading && !recommendation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10">
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px]" />
          
          <CardContent className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-4 items-start sm:items-center w-full">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-pulse" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">AI Strategic Insight</span>
                  {loading ? (
                    <div className="h-3 w-24 bg-indigo-200 dark:bg-indigo-900/50 rounded animate-pulse" />
                  ) : (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${recommendation?.impact_level === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'}`}>
                      {recommendation?.impact_level === 'high' ? 'High Priority' : 'Strategic'}
                    </span>
                  )}
                </div>
                
                {loading ? (
                  <div className="space-y-2 mt-2">
                     <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                     <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-tight truncate">
                      {recommendation?.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 sm:line-clamp-none">
                      {recommendation?.recommendation}
                    </p>
                  </>
                )}
              </div>
            </div>

            {!loading && (
              <Link to="/insights" className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
                  View All Insights
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
