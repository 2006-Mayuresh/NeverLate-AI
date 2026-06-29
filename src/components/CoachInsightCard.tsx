import React from 'react';
import { Sparkles, Brain, RefreshCw } from 'lucide-react';

interface CoachInsightCardProps {
  coachInsight?: string;
  isPrioritizing: boolean;
  onPrioritize: () => void;
  hasTasks: boolean;
}

export default function CoachInsightCard({ coachInsight, isPrioritizing, onPrioritize, hasTasks }: CoachInsightCardProps) {
  return (
    <div id="coach-insight-bubble" className="bg-gradient-to-br from-teal-50 via-cyan-50/40 to-lime-50/30 rounded-3xl border border-cyan-200 p-6 shadow-sm text-left relative overflow-hidden transition-all duration-300 hover:shadow-cyan-100/50 hover:shadow-lg hover:-translate-y-1">
      {/* Decorative ambient blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100/40 rounded-full blur-2xl -translate-y-6 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-lime-100/35 rounded-full blur-2xl translate-y-6 pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Friendly AI Coach Avatar */}
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-lime-400 flex items-center justify-center text-white shadow-md shadow-cyan-200/40 hover:scale-110 duration-300 animate-float">
          <Brain className="h-6 w-6 animate-pulse text-white" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider font-sans">Supportive Coach Insights</h4>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-[9px] font-mono font-bold text-cyan-700 uppercase">
              Gemini AI Advisor
            </span>
          </div>

          {coachInsight ? (
            <p className="text-xs text-slate-900 leading-relaxed font-bold">
              "{coachInsight}"
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-800 leading-relaxed font-bold">
                "Hello there! I'm your supportive productivity companion. Once we align your daily schedule, I'll analyze your energy preferences, recent mood trackers, and habit streaks to provide tailored, compassionate guidance. We'll find your rhythm together."
              </p>
              {hasTasks && (
                <button
                  type="button"
                  onClick={onPrioritize}
                  disabled={isPrioritizing}
                  className="btn-animate inline-flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-cyan-800 transition-all cursor-pointer bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100/80 hover:border-cyan-300 hover:shadow"
                >
                  {isPrioritizing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin text-teal-600" />
                      Analyzing workflow...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                      Prioritize and summon Coach advice →
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
