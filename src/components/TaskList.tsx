import React, { useState } from 'react';
import { Task, Priority, EnergyLevel } from '../types';
import { CheckCircle2, Circle, Clock, Tag, Brain, Trash2, Calendar, AlertTriangle, ChevronDown, ChevronUp, FileText, Check, Search } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  prioritizedSlots?: { [key: string]: { score: number; slot: string; reason: string } };
}

export default function TaskList({ tasks, onUpdateTask, onDeleteTask, prioritizedSlots }: TaskListProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'duration'>('deadline');
  
  // Track expanded task subtasks
  const [expandedTasks, setExpandedTasks] = useState<{ [key: string]: boolean }>({});

  const toggleSubtaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Format date helper
  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    
    // Check if same day
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
    
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  // Determine if a task is overdue
  const isOverdue = (task: Task) => {
    if (task.status === 'completed') return false;
    return new Date(task.deadline).getTime() < Date.now();
  };

  // Handle checking/unchecking main task
  const handleToggleComplete = (task: Task) => {
    const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updatedTask: Task = {
      ...task,
      status: updatedStatus,
      completedAt: updatedStatus === 'completed' ? new Date().toISOString() : undefined
    };
    onUpdateTask(updatedTask);
  };

  // Handle checking/unchecking a subtask checklist item
  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    if (!task.aiSubtasks) return;
    
    const updatedSubtasks = task.aiSubtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    const updatedTask: Task = {
      ...task,
      aiSubtasks: updatedSubtasks
    };
    onUpdateTask(updatedTask);
  };

  // Apply filters and searches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesStatus = true;
    if (filterStatus === 'pending') {
      matchesStatus = task.status === 'pending';
    } else if (filterStatus === 'completed') {
      matchesStatus = task.status === 'completed';
    } else if (filterStatus === 'overdue') {
      matchesStatus = isOverdue(task);
    }

    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Apply sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    
    if (sortBy === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    
    if (sortBy === 'duration') {
      return b.duration - a.duration;
    }

    return 0;
  });

  // Styling helper for priorities
  const getPriorityStyles = (p: Priority) => {
    switch(p) {
      case 'high': return 'bg-rose-50 border border-rose-100 text-rose-700 font-black';
      case 'medium': return 'bg-amber-50 border border-amber-200 text-amber-700 font-black';
      case 'low': return 'bg-slate-50 border border-slate-200 text-slate-500 font-bold';
    }
  };

  // Styling helper for cognitive energy
  const getEnergyStyles = (e: EnergyLevel) => {
    switch(e) {
      case 'high': return 'bg-purple-50 border border-purple-100 text-purple-700 font-black';
      case 'medium': return 'bg-cyan-50 border border-cyan-200 text-cyan-800 font-black';
      case 'low': return 'bg-teal-50 border border-teal-200 text-teal-800 font-black';
    }
  };

  return (
    <div id="task-list-container" className="space-y-6">
      
      {/* Search, Filter, & Sort Controls */}
      <div className="premium-card rounded-3xl p-6 space-y-4 glow-cyan-hover">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          
          {/* Search bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by keyword, tag or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-xs outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-600 font-black font-mono tracking-wider">SORT BY</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-2xl border border-slate-200 py-2.5 px-3.5 text-xs text-slate-700 outline-none focus:border-cyan-500 cursor-pointer bg-white transition-all duration-300"
            >
              <option value="deadline">Nearest Deadline</option>
              <option value="priority">High Priority</option>
              <option value="duration">Estimated Time</option>
            </select>
          </div>

        </div>

        {/* Tab-like status selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          
          {/* Status filter buttons */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1">
            {(['all', 'pending', 'completed', 'overdue'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn-animate py-1.5 px-3.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-white text-cyan-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Priority dropdown quick-filter */}
          <div className="sm:ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-600 font-black font-mono tracking-wider">PRIORITY</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="rounded-2xl border border-slate-200 py-2.5 px-3.5 text-xs text-slate-700 outline-none focus:border-cyan-500 cursor-pointer bg-white transition-all duration-300"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

        </div>
      </div>

      {/* Task Cards Grid */}
      {sortedTasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 py-12 px-6 text-center shadow-sm">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-bounce" />
          <h3 className="text-sm font-black text-slate-700 tracking-tight">No matching tasks found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-bold">
            Try adjusting your search query, status filters, or prompt a new task using the AI Smart Assistant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedTasks.map(task => {
            const overdue = isOverdue(task);
            const slotData = prioritizedSlots ? prioritizedSlots[task.id] : undefined;
            const expanded = !!expandedTasks[task.id];
            
            // Left border accent line color
            let leftBorderAccent = 'border-l-slate-300';
            if (task.status === 'completed') {
              leftBorderAccent = 'border-l-lime-500';
            } else if (overdue) {
              leftBorderAccent = 'border-l-rose-500';
            } else if (task.priority === 'high') {
              leftBorderAccent = 'border-l-amber-500';
            } else if (task.priority === 'medium') {
              leftBorderAccent = 'border-l-cyan-500';
            } else {
              leftBorderAccent = 'border-l-teal-500';
            }

            return (
              <div
                key={task.id}
                className={`group relative bg-white rounded-3xl border border-l-4 transition-all duration-300 p-5.5 ${leftBorderAccent} ${
                  task.status === 'completed'
                    ? 'border-slate-100 opacity-70 bg-slate-50/20'
                    : overdue
                    ? 'border-rose-200/50 shadow-md shadow-rose-50/10'
                    : 'border-slate-200 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-100/20 hover:-translate-y-1'
                }`}
              >
                <div className="flex items-start gap-4">
                  
                  {/* Complete status checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="btn-animate mt-0.5 shrink-0 text-slate-350 hover:text-cyan-600 transition-colors cursor-pointer"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-lime-600 fill-lime-50" />
                    ) : (
                      <Circle className={`h-6 w-6 ${overdue ? 'text-rose-500' : 'text-slate-300 group-hover:text-cyan-500 hover:scale-110 transition-all'}`} />
                    )}
                  </button>

                  {/* Task details body */}
                  <div className="flex-1 space-y-2.5 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Title text */}
                        <h4 className={`text-sm font-black tracking-tight text-slate-800 truncate pr-4 ${
                          task.status === 'completed' ? 'line-through text-slate-400 font-bold' : ''
                        }`}>
                          {task.title}
                        </h4>
                        
                        {/* Urgent / Overdue indicators */}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 font-mono text-[9px] font-bold text-rose-600 uppercase shadow-sm">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}

                        {/* Smart AI Slot Indicator */}
                        {slotData && task.status !== 'completed' && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-lime-500/10 border border-cyan-200 px-2.5 py-0.5 font-sans text-[10px] font-black text-cyan-800 shadow-sm">
                            ⏰ {slotData.slot}
                          </span>
                        )}
                      </div>

                      {/* Notes / Subtext */}
                      {task.notes && (
                        <p className={`text-xs text-slate-700 mt-1 line-clamp-2 leading-relaxed font-bold ${
                          task.status === 'completed' ? 'text-slate-400/80' : ''
                        }`}>
                          {task.notes}
                        </p>
                      )}
                    </div>

                    {/* Metadata Pill Grid */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      
                      {/* Deadline */}
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] text-slate-600 font-bold">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDeadline(task.deadline)}
                      </span>

                      {/* Duration */}
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] text-slate-600 font-bold">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {task.duration} mins
                      </span>

                      {/* Priority */}
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] uppercase tracking-wider font-mono ${getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>

                      {/* Required Energy */}
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] uppercase tracking-wider font-mono ${getEnergyStyles(task.energy)}`}>
                        <Brain className="h-3.5 w-3.5" />
                        {task.energy} effort
                      </span>

                      {/* Tags */}
                      {(task.tags || []).map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-slate-50/50 border border-slate-100/50 px-2.5 py-1 text-[11px] text-slate-500 font-bold">
                          <Tag className="h-3 w-3 text-slate-400" />
                          #{tag}
                        </span>
                      ))}

                    </div>

                    {/* Expand Checklist Indicator Button */}
                    {task.aiSubtasks && task.aiSubtasks.length > 0 && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSubtaskExpand(task.id)}
                          className="btn-animate inline-flex items-center gap-1.5 text-xs font-black text-cyan-700 hover:text-cyan-800 transition-colors cursor-pointer"
                        >
                          {expanded ? <ChevronUp className="h-4 w-4 text-cyan-600" /> : <ChevronDown className="h-4 w-4 text-cyan-600" />}
                          AI Subtask Steps ({task.aiSubtasks.filter(s=>s.completed).length}/{task.aiSubtasks.length})
                        </button>

                        {/* Expanded Checklist Subtask container */}
                        {expanded && (
                          <div className="mt-3.5 pl-1.5 py-3 pr-3 rounded-2xl bg-slate-50/50 border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                            <p className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-wider pl-2 mb-1">TACTICAL STEPS BREAKDOWN</p>
                            <div className="space-y-1.5">
                              {task.aiSubtasks.map(subtask => (
                                <button
                                  key={subtask.id}
                                  onClick={() => handleToggleSubtask(task, subtask.id)}
                                  className="w-full flex items-center gap-2.5 text-left text-xs p-2 rounded-xl hover:bg-white transition-all duration-150 group/st cursor-pointer shadow-none hover:shadow-sm"
                                >
                                  {subtask.completed ? (
                                    <Check className="h-4 w-4 text-lime-600 shrink-0" />
                                  ) : (
                                    <span className="h-4 w-4 rounded-md border border-slate-350 group-hover/st:border-cyan-400 transition-colors shrink-0" />
                                  )}
                                  <span className={`truncate ${subtask.completed ? 'line-through text-slate-400 font-semibold' : 'text-slate-700 font-bold'}`}>
                                    {subtask.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI reasoning explanation */}
                    {task.aiReasoning && task.status !== 'completed' && (
                      <div className="text-[11px] text-slate-600 rounded-2xl bg-gradient-to-tr from-teal-500/5 via-cyan-500/5 to-lime-500/5 border border-cyan-100/30 p-3.5 leading-relaxed flex items-start gap-2 font-bold shadow-inner">
                        <FileText className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                        <span>{task.aiReasoning}</span>
                      </div>
                    )}

                  </div>

                  {/* Actions (Delete icon) */}
                  <div className="shrink-0 flex items-center h-full">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
