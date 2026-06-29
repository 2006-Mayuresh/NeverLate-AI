import React, { useState } from 'react';
import { Habit } from '../types';
import { Award, CheckCircle2, Circle, Flame, Plus, Trash2 } from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string) => void;
  onToggleHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export default function HabitTracker({ habits, onAddHabit, onToggleHabit, onDeleteHabit }: HabitTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle.trim());
    setNewHabitTitle('');
    setShowAddForm(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div id="habit-tracker-card" className="premium-card rounded-3xl p-6 space-y-4 glow-lime-hover">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Flame className="h-5.5 w-5.5 text-lime-500 animate-bounce" />
          <h4 className="text-sm font-black text-slate-800 tracking-tight font-sans">Daily Habit Builder</h4>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-animate text-xs font-bold text-lime-800 hover:text-lime-900 transition-colors flex items-center gap-1 cursor-pointer bg-lime-50/70 px-3 py-1.5 rounded-xl border border-lime-100"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAddForm ? 'View Habits' : 'Add Habit'}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className="space-y-3 animate-in fade-in duration-300">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">What daily habit are we building?</label>
            <input
              type="text"
              placeholder="e.g. Drink 3L water, stretch 10m, review notes"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-700 outline-none transition-all duration-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100/50"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-animate w-full py-3 bg-gradient-to-r from-lime-500 via-teal-500 to-cyan-500 hover:from-lime-600 hover:to-cyan-600 text-white rounded-2xl text-xs font-black shadow-md shadow-lime-100/40 cursor-pointer"
          >
            Create Daily Habit
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
              <Award className="h-6 w-6 text-slate-350 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-[180px] mx-auto">No habits added yet. Start small to build long-term momentum!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {habits.map((habit) => {
                const isCompletedToday = habit.lastCompleted === todayStr;
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                      isCompletedToday
                        ? 'border-lime-200 bg-lime-50/20'
                        : 'border-slate-100 bg-white/70 hover:border-lime-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => onToggleHabit(habit)}
                        className="btn-animate shrink-0 text-slate-350 hover:text-lime-600 transition-colors cursor-pointer"
                      >
                        {isCompletedToday ? (
                          <CheckCircle2 className="h-6 w-6 text-lime-600 fill-lime-50" />
                        ) : (
                          <Circle className="h-6 w-6 text-slate-300 hover:text-lime-500 hover:scale-110 transition-all" />
                        )}
                      </button>
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-black text-slate-700 truncate ${isCompletedToday ? 'line-through text-slate-400 font-bold' : ''}`}>
                          {habit.title}
                        </p>
                        <p className="text-[9px] text-slate-400 font-black font-mono tracking-wider mt-0.5">
                          {habit.history.length} COMPLETIONS TOTAL
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Streak badge */}
                      <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg font-mono text-[10px] font-bold ${
                        habit.streak > 0 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Flame className={`h-3.5 w-3.5 ${habit.streak > 0 ? 'text-amber-500 fill-amber-100 animate-pulse' : ''}`} />
                        {habit.streak}d
                      </span>

                      {/* Delete button */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete the "${habit.title}" habit?`)) {
                            onDeleteHabit(habit.id);
                          }
                        }}
                        className="p-1 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
                        title="Delete Habit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
