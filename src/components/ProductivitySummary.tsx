import React from 'react';
import { Task, MoodLog, Habit } from '../types';
import { BarChart2, Heart, TrendingUp, Zap } from 'lucide-react';

interface ProductivitySummaryProps {
  tasks: Task[];
  moodLogs: MoodLog[];
  habits: Habit[];
}

export default function ProductivitySummary({ tasks, moodLogs, habits }: ProductivitySummaryProps) {
  // Task calculations
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Mood calculations
  const recentMoods = moodLogs.slice(0, 10);
  const avgMood = recentMoods.length > 0
    ? Math.round((recentMoods.reduce((acc, log) => acc + log.mood, 0) / recentMoods.length) * 10) / 10
    : 0;
  const avgEnergy = recentMoods.length > 0
    ? Math.round((recentMoods.reduce((acc, log) => acc + log.energy, 0) / recentMoods.length) * 10) / 10
    : 0;

  // Habit calculations
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter(h => h.lastCompleted === new Date().toISOString().split('T')[0]).length;
  const habitSuccessRate = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  // Best streak habit
  const bestStreakHabit = habits.length > 0
    ? habits.reduce((prev, current) => (prev.streak > current.streak) ? prev : current)
    : null;

  // Render mood log trend line SVG
  const renderTrendLine = () => {
    if (recentMoods.length < 2) {
      return (
        <div className="h-28 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
          <p className="text-xs text-slate-400 font-medium">Log more mood sessions to visualize waves</p>
        </div>
      );
    }

    // Sort logs chronologically for the chart
    const chronLogs = [...recentMoods].reverse();
    const width = 280;
    const height = 90;
    const padding = 15;
    
    const points = chronLogs.map((log, index) => {
      const x = padding + (index * (width - (padding * 2))) / (chronLogs.length - 1);
      const y = height - padding - ((log.mood - 1) * (height - (padding * 2))) / 4;
      return `${x},${y}`;
    }).join(' ');

    const energyPoints = chronLogs.map((log, index) => {
      const x = padding + (index * (width - (padding * 2))) / (chronLogs.length - 1);
      const y = height - padding - ((log.energy - 1) * (height - (padding * 2))) / 4;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="space-y-2">
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 shadow-inner">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f8fafc" strokeWidth="1" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f8fafc" strokeWidth="1" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f8fafc" strokeWidth="1" />

            {/* Mood Line */}
            <polyline
              fill="none"
              stroke="url(#moodGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Energy Line */}
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={energyPoints}
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>
            </defs>

            {/* Data nodes */}
            {chronLogs.map((log, index) => {
              const x = padding + (index * (width - (padding * 2))) / (chronLogs.length - 1);
              const y = height - padding - ((log.mood - 1) * (height - (padding * 2))) / 4;
              return (
                <circle
                  key={`m-${log.id}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#fff"
                  stroke={index === chronLogs.length - 1 ? "#84cc16" : "#06b6d4"}
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold font-mono mt-2 px-1">
            <span>OLDER LOGS</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-600"></span> Mood</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-600"></span> Energy</span>
            </div>
            <span>LATEST</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="productivity-analytics-card" className="premium-card rounded-3xl p-5.5 space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <BarChart2 className="h-5 w-5 text-sky-600 animate-pulse" />
        <h4 className="text-sm font-black text-slate-800 tracking-tight font-sans">Weekly Coach Analytics</h4>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {/* Task Success Card */}
        <div className="p-3 bg-gradient-to-br from-teal-500/10 to-sky-500/5 border border-teal-100/50 rounded-2xl text-left hover:shadow-sm duration-350 transition-all">
          <span className="text-[10px] text-teal-800/90 font-mono font-bold uppercase tracking-wider block">TASK RATIO</span>
          <span className="text-xl font-extrabold text-teal-800 tracking-tight block mt-1">{rate}%</span>
          <p className="text-[9px] text-slate-500 mt-1 font-bold">{completed} of {total} finished</p>
        </div>

        {/* Habit Completion Card */}
        <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-100/50 rounded-2xl text-left hover:shadow-sm duration-350 transition-all">
          <span className="text-[10px] text-emerald-800/90 font-mono font-bold uppercase tracking-wider block">HABITS TODAY</span>
          <span className="text-xl font-extrabold text-emerald-800 tracking-tight block mt-1">{habitSuccessRate}%</span>
          <p className="text-[9px] text-slate-500 mt-1 font-bold">{completedTodayCount} of {totalHabits} completed</p>
        </div>
      </div>

      {/* Mood averages metrics */}
      {recentMoods.length > 0 && (
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-purple-50/25 rounded-2xl border border-slate-100/85 hover:border-purple-200 duration-300">
          <div className="flex items-center gap-2.5">
            <Heart className="h-4.5 w-4.5 text-rose-500 fill-rose-100 animate-pulse" />
            <div>
              <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">AVG WELLBEING</span>
              <span className="text-xs font-bold text-slate-700">{avgMood}/5 Mood • {avgEnergy}/5 Energy</span>
            </div>
          </div>
          {avgMood >= 4 ? (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-xl shadow-sm">Focused</span>
          ) : avgMood <= 2 ? (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-xl shadow-sm">Recharging</span>
          ) : (
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-xl shadow-sm">Balanced</span>
          )}
        </div>
      )}

      {/* Best streak habit showcase */}
      {bestStreakHabit && bestStreakHabit.streak > 0 && (
        <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/20 border border-amber-200 rounded-2xl flex items-center justify-between text-left hover:-translate-y-0.5 transition-all duration-350">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
            <div>
              <span className="text-[9px] text-amber-800 font-mono font-bold uppercase tracking-wider block">TOP STREAK BUILDER</span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] block mt-0.5">{bestStreakHabit.title}</span>
            </div>
          </div>
          <span className="text-xs font-black text-amber-800 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 px-3 py-1 rounded-xl shadow-sm shrink-0">
            🔥 {bestStreakHabit.streak} Days
          </span>
        </div>
      )}

      {/* Trend line visualizer */}
      <div className="space-y-1.5 text-left">
        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block pl-1">VIBE & COGNITIVE WAVE TRENDS</span>
        {renderTrendLine()}
      </div>
    </div>
  );
}
