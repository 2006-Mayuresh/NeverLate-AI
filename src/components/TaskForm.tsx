import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, Brain, ListPlus, AlertCircle, X, Check } from 'lucide-react';
import { parseNaturalLanguageTask } from '../services/ai';
import { Priority, EnergyLevel, Task, Subtask } from '../types';

interface TaskFormProps {
  userId: string;
  onTaskCreated: (task: Task) => void;
  onCancel?: () => void;
}

export default function TaskForm({ userId, onTaskCreated, onCancel }: TaskFormProps) {
  const getDefaultDeadline = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0); // 5:00 PM tomorrow
    const tzoffset = tomorrow.getTimezoneOffset() * 60000;
    return new Date(tomorrow.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [nlInput, setNlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Parsed Preview / Manual state
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [priority, setPriority] = useState<Priority>('medium');
  const [duration, setDuration] = useState<number>(30);
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Parse natural language task with Gemini
  const handleAIParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim()) return;

    setIsParsing(true);
    setParseError('');

    try {
      const parsed = await parseNaturalLanguageTask(nlInput);
      
      setTitle(parsed.title);
      // Format deadline to yyyy-MM-ddThh:mm for input datetime-local
      if (parsed.deadline) {
        const dateObj = new Date(parsed.deadline);
        const tzoffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = new Date(dateObj.getTime() - tzoffset).toISOString().slice(0, 16);
        setDeadline(localISOTime);
      } else {
        setDeadline(getDefaultDeadline());
      }
      setPriority(parsed.priority || 'medium');
      setDuration(parsed.duration || 30);
      setEnergy(parsed.energy || 'medium');
      setTags(parsed.tags || []);
      setNotes(parsed.notes || '');
      setSubtasks(parsed.subtasks || []);
      
      setShowPreviewModal(true);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Gemini was unable to parse this input. Please try again or use the Manual tab.');
    } finally {
      setIsParsing(false);
    }
  };

  // Add custom tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Add subtask field
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      setSubtasks([...subtasks, newSubtaskText.trim()]);
      setNewSubtaskText('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Save Task
  const handleSaveTask = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      return;
    }

    const taskSubtasks: Subtask[] = subtasks.map((st, idx) => ({
      id: `st_${Date.now()}_${idx}`,
      title: st,
      completed: false
    }));

    const finalDeadline = deadline || getDefaultDeadline();
    let isoDeadline = '';
    try {
      isoDeadline = new Date(finalDeadline).toISOString();
    } catch (err) {
      isoDeadline = new Date(getDefaultDeadline()).toISOString();
    }

    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      userId,
      title: title.trim(),
      deadline: isoDeadline,
      priority,
      status: 'pending',
      duration,
      energy,
      tags,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      aiSubtasks: taskSubtasks.length > 0 ? taskSubtasks : undefined,
      aiReasoning: activeTab === 'ai' ? 'Extracted using natural language input and smart schedule blocks.' : 'Created manually by user.'
    };

    onTaskCreated(newTask);
    resetForm();
  };

  const resetForm = () => {
    setNlInput('');
    setTitle('');
    setDeadline(getDefaultDeadline());
    setPriority('medium');
    setDuration(30);
    setEnergy('medium');
    setTags([]);
    setNotes('');
    setSubtasks([]);
    setShowPreviewModal(false);
  };

  return (
    <div id="task-creation-card" className="premium-card rounded-3xl p-6.5 hover:!transform-none hover:!border-slate-250/20 hover:!shadow-premium">
      
      {/* Selector Tab Header */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1.5 mb-6 border border-slate-200/30">
        <button
          onClick={() => { setActiveTab('ai'); setParseError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-white text-cyan-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="h-4 w-4 text-cyan-600 animate-pulse" />
          AI Smart Assistant
        </button>
        <button
          onClick={() => { setActiveTab('manual'); setParseError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white text-cyan-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListPlus className="h-4 w-4 text-cyan-600" />
          Manual Creation
        </button>
      </div>

      {/* AI Smart Input Path */}
      {activeTab === 'ai' && (
        <div>
          <form onSubmit={handleAIParse} className="space-y-4">
            <div>
              <label htmlFor="nl-prompt-input" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                Describe your task naturally
              </label>
              <div className="relative">
                <textarea
                  id="nl-prompt-input"
                  rows={3}
                  value={nlInput}
                  onChange={(e) => setNlInput(e.target.value)}
                  placeholder="e.g. Finish chemistry lab analysis by tomorrow at 4 PM, priority high, needs high focus. Also make sure to double check calculations and print the report."
                  className="block w-full rounded-2xl border border-slate-200 p-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 resize-none leading-relaxed"
                />
              </div>
              <div className="mt-3.5 rounded-2xl bg-gradient-to-tr from-teal-500/5 via-cyan-500/5 to-lime-500/5 border border-cyan-100/50 p-4">
                <p className="text-xs text-slate-600 leading-relaxed font-bold flex items-start gap-1.5">
                  <Sparkles className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>
                    Gemini will automatically determine: computed deadlines, cognitive effort levels, duration estimates, tag categories, and generate a step-by-step checklist!
                  </span>
                </p>
              </div>
            </div>

            {parseError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3.5 flex items-start gap-2 animate-in slide-in-from-top-1">
                <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-700 font-bold leading-relaxed">{parseError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-animate px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isParsing || !nlInput.trim()}
                className="btn-animate flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 hover:from-teal-600 hover:to-lime-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 text-xs font-black shadow-md shadow-cyan-100 transition-all cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Gemini AI Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    AI Smart Parse
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Interactive AI Preview Modal */}
          {showPreviewModal && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay background */}
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setShowPreviewModal(false)} />
              
              <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 z-50 p-6 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 tracking-tight font-sans">AI Parsed Task Review</h3>
                      <p className="font-mono text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Review scheduling parameters</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} className="space-y-4">
                  
                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Task Name</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
                    />
                  </div>

                  {/* Deadline & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Deadline</label>
                      <input
                        type="datetime-local"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Est. Duration (mins)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
                      />
                    </div>
                  </div>

                  {/* Priority & Energy */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Urgency / Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 bg-white"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Mental Energy</label>
                      <select
                        value={energy}
                        onChange={(e) => setEnergy(e.target.value as EnergyLevel)}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 bg-white"
                      >
                        <option value="low">Low Energy (Routine)</option>
                        <option value="medium">Medium Energy</option>
                        <option value="high">High Energy (Deep Focus)</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Categories & Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-cyan-50/70 border border-cyan-100 px-2.5 py-1 text-[11px] text-cyan-700 font-bold">
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-600 ml-0.5"><X className="h-3.5 w-3.5" /></button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Type a tag & press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
                    />
                  </div>

                  {/* Checklist Subtasks */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">AI Subtask Checklist</label>
                    <ul className="space-y-1.5 mb-2.5">
                      {subtasks.map((st, idx) => (
                        <li key={idx} className="flex items-center justify-between rounded-2xl bg-slate-50/70 p-3 border border-slate-100 text-xs text-slate-700">
                          <span className="truncate font-semibold">{st}</span>
                          <button type="button" onClick={() => removeSubtask(idx)} className="text-slate-400 hover:text-rose-600 p-0.5"><X className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add subtask step..."
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                        className="flex-1 rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="btn-animate px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Context Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 resize-none focus:ring-4 focus:ring-cyan-100/50"
                    />
                  </div>

                  {/* Save actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(false)}
                      className="btn-animate px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      Tweak Prompt
                    </button>
                    <button
                      type="submit"
                      className="btn-animate flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 hover:from-teal-600 hover:to-lime-600 text-white px-5 py-2.5 text-xs font-black shadow-md shadow-cyan-100/45 active:scale-98 transition-all cursor-pointer"
                    >
                      <Check className="h-4.5 w-4.5 animate-pulse" />
                      Add to Dashboard
                    </button>
                  </div>

                </form>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Manual Creation Path */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label htmlFor="manual-title" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
              Task Title
            </label>
            <input
              id="manual-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean chemistry lab equipment"
              className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="manual-deadline" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                Deadline (Date & Time)
              </label>
              <input
                id="manual-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
              />
            </div>

            <div>
              <label htmlFor="manual-duration" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                Estimated Duration (minutes)
              </label>
              <input
                id="manual-duration"
                type="number"
                required
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="manual-priority" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                Priority Urgency
              </label>
              <select
                id="manual-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label htmlFor="manual-energy" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                Required Cognitive Energy
              </label>
              <select
                id="manual-energy"
                value={energy}
                onChange={(e) => setEnergy(e.target.value as EnergyLevel)}
                className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 bg-white"
              >
                <option value="low">Low Energy (Routine)</option>
                <option value="medium">Medium Energy</option>
                <option value="high">High Energy (Deep Focus)</option>
              </select>
            </div>
          </div>

          {/* Tag creation */}
          <div>
            <label htmlFor="manual-tags" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
              Tags / Categories
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-cyan-50/70 border border-cyan-100 px-2.5 py-1 text-xs text-cyan-700 font-bold">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-600 ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <input
              id="manual-tags"
              type="text"
              placeholder="Press Enter to add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50"
            />
          </div>

          <div>
            <label htmlFor="manual-notes" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
              Additional Notes (Optional)
            </label>
            <textarea
              id="manual-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other details..."
              className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs text-slate-800 outline-none transition-all duration-300 focus:border-cyan-500 resize-none focus:ring-4 focus:ring-cyan-100/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-animate px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!title.trim()}
              className="btn-animate flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 hover:from-teal-600 hover:to-lime-600 disabled:opacity-50 text-white px-6 py-3 text-xs font-black shadow-md shadow-cyan-100/40 transition-all cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
