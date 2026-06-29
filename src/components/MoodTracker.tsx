import React, { useState } from 'react';
import { MoodLog } from '../types';
import { Sparkles, Brain, Zap, Clock, Smile, Plus, MessageSquare } from 'lucide-react';

interface MoodTrackerProps {
  moodLogs: MoodLog[];
  onLogMood: (mood: number, energy: number, notes?: string) => void;
}

export default function MoodTracker({ moodLogs, onLogMood }: MoodTrackerProps) {
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogMood(mood, energy, notes.trim() || undefined);
    setNotes('');
    setShowLogForm(false);
  };

  const moodLabels = [
    { value: 1, emoji: '😫', label: 'Overwhelmed', color: 'text-rose-600 bg-rose-50/70 border-rose-100' },
    { value: 2, emoji: '😴', label: 'Tired', color: 'text-amber-600 bg-amber-50/70 border-amber-200' },
    { value: 3, emoji: '🧘', label: 'Calm & Steady', color: 'text-cyan-600 bg-cyan-50/70 border-cyan-100' },
    { value: 4, emoji: '🧠', label: 'Highly Focused', color: 'text-teal-600 bg-teal-50/70 border-teal-100' },
    { value: 5, emoji: '⚡', label: 'Energetic', color: 'text-lime-700 bg-lime-50/70 border-lime-200' },
  ];

  const currentMoodObj = moodLabels.find(m => m.value === mood) || moodLabels[2];

  return (
    <div id="mood-tracker-card" className="premium-card rounded-3xl p-6 space-y-4 glow-cyan-hover">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Smile className="h-5.5 w-5.5 text-cyan-600 animate-pulse" />
          <h4 className="text-sm font-black text-slate-800 tracking-tight font-sans">Mood & Energy Coach</h4>
        </div>
        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="btn-animate text-xs font-bold text-cyan-800 hover:text-cyan-900 transition-colors flex items-center gap-1 cursor-pointer bg-cyan-50/70 px-3 py-1.5 rounded-xl border border-cyan-100"
        >
          <Plus className="h-3.5 w-3.5" />
          {showLogForm ? 'View Logs' : 'Log State'}
        </button>
      </div>

      {showLogForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
          {/* Mood Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">How do you feel right now?</label>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${currentMoodObj.color} shadow-sm`}>
                {currentMoodObj.emoji} {currentMoodObj.label}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none transition-all"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1">
              <span>😫</span>
              <span>😴</span>
              <span>🧘</span>
              <span>🧠</span>
              <span>⚡</span>
            </div>
          </div>

          {/* Energy Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cognitive Energy ({energy}/5)</label>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-100 flex items-center gap-1 shadow-sm">
                <Zap className="h-3.5 w-3.5 fill-teal-400 text-teal-500" />
                {energy === 1 ? 'Exhausted' : energy === 2 ? 'Low Focus' : energy === 3 ? 'Moderate' : energy === 4 ? 'High' : 'Peak Energy'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none transition-all"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono px-1">
              <span>1 (Drained)</span>
              <span>3 (Normal)</span>
              <span>5 (Alert)</span>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Context / Vibe Notes</label>
            <input
              type="text"
              placeholder="e.g. Just finished lunch, feeling slightly sleepy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
            />
          </div>

          <button
            type="submit"
            className="btn-animate w-full py-3 bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 hover:from-teal-600 hover:to-lime-600 text-white rounded-2xl text-xs font-black shadow-md shadow-cyan-100/40 cursor-pointer"
          >
            Log Session State
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {moodLogs.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
              <Smile className="h-6 w-6 text-slate-300 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-[180px] mx-auto">No logs for today. Tell your coach how you're feeling!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {moodLogs.slice(0, 3).map((log) => {
                const logMoodObj = moodLabels.find(m => m.value === log.mood) || moodLabels[2];
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={log.id} className="p-3.5 bg-white/75 border border-slate-100/80 rounded-2xl space-y-2 text-left hover:border-cyan-200 transition-all shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{logMoodObj.emoji}</span>
                        <span className="text-xs font-black text-slate-700">{logMoodObj.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-100 font-bold">
                          ⚡ {log.energy}/5 Energy
                        </span>
                        <span className="inline-flex items-center gap-0.5 font-bold"><Clock className="h-3 w-3 text-slate-350" /> {timeStr}</span>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-[11px] text-slate-500 italic leading-relaxed flex items-start gap-1 font-semibold">
                        <MessageSquare className="h-3 w-3 text-slate-350 shrink-0 mt-0.5" />
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
              {moodLogs.length > 3 && (
                <p className="text-[10px] text-slate-400 text-center font-bold font-mono uppercase tracking-wider">+ {moodLogs.length - 3} Older Entries</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
