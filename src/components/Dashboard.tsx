import React, { useState, useEffect } from 'react';
import { Task, User, SmartScheduleResult, MoodLog, Habit } from '../types';
import { getTasks, saveTask, saveTasks, deleteTask, getMoodLogs, saveMoodLog, getHabits, saveHabit, deleteHabit } from '../services/localDb';
import { generateSmartSchedule } from '../services/ai';
import Navbar from './Navbar';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import MoodTracker from './MoodTracker';
import HabitTracker from './HabitTracker';
import ProductivitySummary from './ProductivitySummary';
import CoachInsightCard from './CoachInsightCard';
import { Sparkles, Calendar, Clock, Award, AlertTriangle, Play, HelpCircle, Lightbulb, RefreshCw, Quote, BarChart2 } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Dashboard({ user, onLogout, theme, onToggleTheme }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Smart prioritization state
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<SmartScheduleResult | null>(null);
  const [prioritizeError, setPrioritizeError] = useState('');

  // Load tasks, mood logs, and habits on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedTasks = await getTasks(user.id);
        setTasks(loadedTasks);
        
        const loadedMoods = await getMoodLogs(user.id);
        setMoodLogs(loadedMoods);

        const loadedHabits = await getHabits(user.id);
        setHabits(loadedHabits);
      } catch (e) {
        console.error('Failed to load dashboard data from server', e);
      }
    };
    loadData();
    
    // Load last prioritized schedule if saved in localStorage
    const savedSchedule = localStorage.getItem(`neverlate_schedule_${user.id}`);
    if (savedSchedule) {
      try {
        setScheduleResult(JSON.parse(savedSchedule));
      } catch (e) {
        console.error('Failed to parse saved schedule', e);
      }
    }
  }, [user.id]);

  // Handle updated task state
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await saveTask(updatedTask);
      const updatedList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      setTasks(updatedList);
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  // Handle deleted task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      
      // Clean up schedule result task references if any
      if (scheduleResult) {
        const updatedPrioritized = scheduleResult.prioritizedTasks.filter(pt => pt.taskId !== taskId);
        const updatedResult = { ...scheduleResult, prioritizedTasks: updatedPrioritized };
        setScheduleResult(updatedResult);
        localStorage.setItem(`neverlate_schedule_${user.id}`, JSON.stringify(updatedResult));
      }
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  // Handle saved new task
  const handleTaskCreated = async (newTask: Task) => {
    try {
      await saveTask(newTask);
      setTasks([newTask, ...tasks]);
      setShowTaskForm(false);
    } catch (e) {
      console.error('Failed to save created task', e);
    }
  };

  // Mood Logger Actions
  const handleLogMood = async (mood: number, energy: number, notes?: string) => {
    const newLog: MoodLog = {
      id: 'mood_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      timestamp: new Date().toISOString(),
      mood,
      energy,
      notes
    };
    try {
      await saveMoodLog(newLog);
      setMoodLogs([newLog, ...moodLogs]);
    } catch (e) {
      console.error('Failed to log mood', e);
    }
  };

  // Habit Builder Actions
  const handleAddHabit = async (title: string) => {
    const newHabit: Habit = {
      id: 'habit_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title,
      streak: 0,
      history: [],
      createdAt: new Date().toISOString()
    };
    try {
      await saveHabit(newHabit);
      setHabits([newHabit, ...habits]);
    } catch (e) {
      console.error('Failed to add habit', e);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
      setHabits(habits.filter(h => h.id !== habitId));
    } catch (e) {
      console.error('Failed to delete habit', e);
    }
  };

  const handleToggleHabit = async (habit: Habit) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.lastCompleted === todayStr;
    
    let updatedHistory = [...habit.history];
    let updatedStreak = habit.streak;
    let newLastCompleted = habit.lastCompleted;

    if (isCompletedToday) {
      // Uncheck habit: remove today from history
      updatedHistory = updatedHistory.filter(date => date !== todayStr);
      newLastCompleted = updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : undefined;
      updatedStreak = Math.max(0, updatedStreak - 1);
    } else {
      // Check habit: add today to history
      updatedHistory.push(todayStr);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (habit.lastCompleted === yesterdayStr) {
        updatedStreak += 1;
      } else if (!habit.lastCompleted || habit.lastCompleted < yesterdayStr) {
        updatedStreak = 1;
      }
      
      newLastCompleted = todayStr;
    }

    const updatedHabit: Habit = {
      ...habit,
      history: updatedHistory,
      streak: updatedStreak,
      lastCompleted: newLastCompleted
    };

    try {
      await saveHabit(updatedHabit);
      setHabits(habits.map(h => h.id === habit.id ? updatedHabit : h));
    } catch (e) {
      console.error('Failed to save habit state', e);
    }
  };

  // Trigger Gemini smart scheduler
  const handlePrioritizeClick = async () => {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
      setPrioritizeError("You don't have any pending tasks to prioritize. Add some tasks first!");
      return;
    }

    setIsPrioritizing(true);
    setPrioritizeError('');

    try {
      const result = await generateSmartSchedule(pendingTasks, user, moodLogs, habits);
      setScheduleResult(result);
      localStorage.setItem(`neverlate_schedule_${user.id}`, JSON.stringify(result));
      
      // Update each task's local state with the computed score and reasoning so it displays on task cards
      const updatedTasks = tasks.map(task => {
        const aiRec = result.prioritizedTasks.find(pt => pt.taskId === task.id);
        if (aiRec) {
          return {
            ...task,
            aiReasoning: aiRec.reason
          };
        }
        return task;
      });
      
      await saveTasks(updatedTasks);
      setTasks(updatedTasks);
    } catch (err: any) {
      console.error(err);
      setPrioritizeError(err.message || "Failed to parse smart schedule from Gemini. Please check your secrets configurations.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Statistics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueCount = tasks.filter(t => t.status === 'pending' && new Date(t.deadline).getTime() < Date.now()).length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalFocusHours = tasks.reduce((acc, t) => acc + t.duration, 0);
  const focusRating = scheduleResult ? scheduleResult.focusRating : 80; // Fallback to 80% if not generated

  // Build key-value mapping of taskId => score details to pass to task list
  const prioritizedSlots: { [key: string]: { score: number; slot: string; reason: string } } = {};
  if (scheduleResult) {
    scheduleResult.prioritizedTasks.forEach(pt => {
      prioritizedSlots[pt.taskId] = {
        score: pt.score,
        slot: pt.recommendedTime,
        reason: pt.reason
      };
    });
  }

  return (
    <div id="dashboard-layout" className="min-h-screen bg-slate-50/50 dark:bg-[#070b19] flex flex-col pb-16 transition-colors duration-300">
      
      {/* Navigation Header */}
      <Navbar user={user} onLogout={onLogout} focusRating={focusRating} theme={theme} onToggleTheme={onToggleTheme} />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sans">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed font-medium">
              Your Peak Focus hours are in the <span className="text-teal-600 dark:text-teal-400 font-extrabold capitalize">{user.energyPreference}s</span>. Let's arrange your tasks to maximize daily flow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="toggle-add-task-button"
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="btn-animate flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-lime-400 hover:from-teal-600 hover:to-lime-500 text-white px-6 py-3.5 text-xs font-black shadow-lg shadow-cyan-200/50 transition-all cursor-pointer border border-transparent"
            >
              <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />
              {showTaskForm ? "Close Creator" : "Add Smart Task"}
            </button>
          </div>
        </div>

        {/* Dynamic Expandable Creator form */}
        {showTaskForm && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <TaskForm userId={user.id} onTaskCreated={handleTaskCreated} onCancel={() => setShowTaskForm(false)} />
          </div>
        )}

        {/* Bento Metrics Panel */}
        <section id="metrics-panel" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Focus Rating Score Card */}
          <div className="premium-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-350 hover:shadow-lg hover:-translate-y-1 glow-cyan-hover">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-slate-500 font-black uppercase tracking-wider block">FOCUS HEALTH</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 block">{focusRating}%</span>
              </div>
              <div className="p-2.5 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-2xl">
                <Award className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full" style={{ width: `${focusRating}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2.5 font-bold">Evaluated from schedule distribution balance.</p>
            </div>
          </div>

          {/* Completion metrics */}
          <div className="premium-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-350 hover:shadow-lg hover:-translate-y-1 glow-lime-hover">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-slate-500 font-black uppercase tracking-wider block">TASKS COMPLETED</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 block">{completedTasks} / {totalTasks}</span>
              </div>
              <div className="p-2.5 bg-lime-50 border border-lime-200 text-lime-600 rounded-2xl">
                <BarChart2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-lime-500 h-full rounded-full" style={{ width: `${completionRate}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2.5 font-bold">{completionRate}% total completion rate.</p>
            </div>
          </div>

          {/* Overdue alerts */}
          <div className="premium-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-350 hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-slate-500 font-black uppercase tracking-wider block">OVERDUE DEADLINES</span>
                <span className="text-2xl font-black text-rose-600 tracking-tight mt-1.5 block">{overdueCount}</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-rose-600 mt-5 font-bold leading-relaxed">
              {overdueCount > 0 ? "⚠️ Critical alert: finish outstanding items to avoid penalty." : "✨ Excellent! You have no overdue deadlines."}
            </p>
          </div>

          {/* Total duration */}
          <div className="premium-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-350 hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-slate-500 font-black uppercase tracking-wider block">ALLOCATED TIME</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 block">{Math.round(totalFocusHours / 60 * 10) / 10} hrs</span>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-5 font-bold leading-relaxed">
              Total estimated cognitive time commitments.
            </p>
          </div>

        </section>

        {/* Dashboard Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Tasks Stream (Left - 2cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Coach speech bubble card showing the coachInsight comment */}
            <CoachInsightCard
              coachInsight={scheduleResult?.coachInsight}
              isPrioritizing={isPrioritizing}
              onPrioritize={handlePrioritizeClick}
              hasTasks={tasks.some(t => t.status === 'pending')}
            />

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">Your Task Library</h3>
              <span className="font-mono text-[10px] text-cyan-800 bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full font-black">
                {pendingTasks.length} PENDING
              </span>
            </div>

            <TaskList 
              tasks={tasks} 
              onUpdateTask={handleUpdateTask} 
              onDeleteTask={handleDeleteTask}
              prioritizedSlots={prioritizedSlots}
            />
          </div>

          {/* Habit Tracker, Mood Tracker & Analytics Sidebars (Right - 1col) */}
          <div className="space-y-6">
            
            {/* 1. Mood & Energy tracking box */}
            <MoodTracker moodLogs={moodLogs} onLogMood={handleLogMood} />

            {/* 2. Habit streaks tracker */}
            <HabitTracker
              habits={habits}
              onAddHabit={handleAddHabit}
              onToggleHabit={handleToggleHabit}
              onDeleteHabit={handleDeleteHabit}
            />

            {/* 3. Productivity trends charts */}
            <ProductivitySummary tasks={tasks} moodLogs={moodLogs} habits={habits} />

            {/* 4. AI Prioritization trigger area */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight font-sans">AI Schedule Alignment</h3>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse"></span>
              </div>

              <div className="bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 rounded-3xl text-white p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
                
                {/* Overlay graphics */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-5 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <Sparkles className="h-4.5 w-4.5 animate-bounce text-teal-400" />
                    </div>
                    <h4 className="text-xs font-black font-sans uppercase tracking-wider text-slate-200">Dynamic Prioritization</h4>
                  </div>

                  <p className="text-xs text-teal-200/90 leading-relaxed font-semibold">
                    Evaluate your workflow structure against deadlines, duration estimates, required efforts, and your preferred peak work period ({user.energyPreference}s).
                  </p>

                  {prioritizeError && (
                    <div className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-rose-300 text-[11px] leading-relaxed font-bold">
                      ❌ {prioritizeError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePrioritizeClick}
                    disabled={isPrioritizing}
                    className="btn-animate w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 disabled:opacity-50 py-3.5 text-xs font-bold text-white shadow-lg shadow-teal-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    {isPrioritizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-teal-300" />
                        Gemini Aligning Schedule...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        Build Smart Prioritization
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Prioritization results display container */}
              {scheduleResult ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  
                  {/* Motivation quote */}
                  <div className="bg-gradient-to-br from-teal-50/70 via-sky-50/50 to-purple-50/30 rounded-3xl border border-teal-100 p-5 space-y-2 text-slate-800 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex gap-2 items-start">
                      <Quote className="h-4.5 w-4.5 text-teal-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold font-sans italic text-slate-700 leading-relaxed">
                        "{scheduleResult.motivationQuote}"
                      </p>
                    </div>
                  </div>

                  {/* Daily routines / suggestions */}
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 p-5.5 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pl-0.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      AI Timeline Schedule Block
                    </h4>
                    <ul className="space-y-3.5">
                      {scheduleResult.dailyRoutineSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-[10px] font-bold text-teal-700 font-mono mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-600 leading-relaxed">
                            {suggestion}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Customized Productivity tip */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/20 rounded-3xl border border-amber-200 p-5 space-y-2 text-slate-800 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex gap-2 items-start">
                      <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className="text-[9px] font-black font-mono text-amber-700 uppercase tracking-wider">PRODUCTIVITY TIP</h4>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed mt-1">
                          {scheduleResult.productivityTip}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/50 border-dashed rounded-3xl p-6.5 text-center shadow-inner">
                  <HelpCircle className="h-6 w-6 text-slate-300 mx-auto mb-2 animate-bounce" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">No prioritized schedule yet</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                    Click the "Build Smart Prioritization" button above to evaluate deadlines and align your day!
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* Humble Footer info */}
      <footer className="py-8 bg-transparent mt-12 text-center text-[10px] text-slate-400 font-bold font-mono tracking-wide">
        NeverLate AI Workspace • Crafted with clean light design & modularity for Firestore integration.
      </footer>

    </div>
  );
}
