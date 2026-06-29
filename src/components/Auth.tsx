import React, { useState } from 'react';
import { registerUser, loginUser, getUsers } from '../services/localDb';
import { User } from '../types';
import { Sparkles, ArrowRight, Sun, Sunset, Moon, Target, Mail, Shield, User as UserIcon } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Auth({ onAuthSuccess, theme, onToggleTheme }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [energyPreference, setEnergyPreference] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [focusGoal, setFocusGoal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    try {
      const user = await loginUser(email);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError('No user found with this email. Click "Create account" to sign up!');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during sign in.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !name || !focusGoal) {
      setError('All fields are required.');
      return;
    }

    try {
      const user = await registerUser(name, email, energyPreference, focusGoal);
      setSuccess('Account created successfully!');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 800);
    } catch (e: any) {
      setError(e.message || 'An error occurred during registration.');
    }
  };

  // Pre-fill fields for quick trial
  const handleQuickTrial = async () => {
    const randomId = Math.floor(Math.random() * 1000);
    try {
      const trialUser = await registerUser(
        'Demo User',
        `demo_${randomId}@neverlate.ai`,
        'morning',
        'Pass my university finals and optimize my daily study schedule.'
      );
      onAuthSuccess(trialUser);
    } catch (e: any) {
      setError(e.message || 'An error occurred during demo setup.');
    }
  };

  return (
    <div id="auth-page" className="min-h-screen bg-gradient-to-tr from-slate-50 via-teal-50/10 to-cyan-50/20 dark:from-[#070b19] dark:via-teal-950/5 dark:to-cyan-950/10 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Floating Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
          className="btn-animate flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer shadow-md transition-all duration-300"
        >
          {theme === 'light' ? (
            <Moon className="h-4.5 w-4.5" />
          ) : (
            <Sun className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Premium Floating Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-200/40 dark:bg-cyan-950/15 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-purple-200/30 dark:bg-purple-950/15 rounded-full blur-[140px] animate-float-reverse pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-lime-200/35 dark:bg-lime-950/15 rounded-full blur-[110px] animate-float pointer-events-none" />
      <div className="absolute top-[10%] right-[25%] w-[300px] h-[300px] bg-teal-200/30 dark:bg-teal-950/15 rounded-full blur-[100px] animate-float pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-lime-400 text-white shadow-xl shadow-cyan-200/50 hover:scale-110 duration-300 animate-float">
            <Sparkles className="h-8 w-8 animate-pulse text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          NeverLate <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 bg-clip-text text-transparent">AI</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-300 font-semibold font-sans tracking-wide">
          Your supportive productivity coach powered by Gemini 3.5
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-1">
        <div className="bg-white/95 backdrop-blur-2xl py-9 px-8 shadow-[0_25px_60px_rgba(6,182,212,0.08)] rounded-3xl border border-white/85 sm:px-10 hover:shadow-[0_25px_60px_rgba(6,182,212,0.15)] hover:border-cyan-200/60 transition-all duration-300">
          
          {/* Tabs */}
          <div className="flex border border-slate-100 mb-8 p-1 bg-slate-100/60 rounded-2xl">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-slate-900 shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                isSignUp 
                  ? 'bg-white text-slate-900 shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in slide-in-from-top-1 duration-200">
              {success}
            </div>
          )}

          {!isSignUp ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="signin-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative rounded-2xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-animate flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-teal-100/60 active:scale-95 cursor-pointer"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <UserIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="block w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Energy Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Peak Energy Period
                </label>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed font-semibold">
                  When do you feel most focused and alert? We will prioritize high cognitive tasks here.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnergyPreference('morning')}
                    className={`btn-animate flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                      energyPreference === 'morning'
                        ? 'border-amber-300 bg-amber-50/50 text-amber-950 font-bold shadow-md shadow-amber-100/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/30'
                    }`}
                  >
                    <Sun className="h-5 w-5 text-amber-500 mb-1" />
                    <span className="text-[11px] font-sans">Morning</span>
                    <span className="font-mono text-[8px] text-slate-400 uppercase mt-0.5 font-bold">8am - 12pm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnergyPreference('afternoon')}
                    className={`btn-animate flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                      energyPreference === 'afternoon'
                        ? 'border-cyan-300 bg-cyan-50/40 text-cyan-950 font-bold shadow-md shadow-cyan-100/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/30'
                    }`}
                  >
                    <Sunset className="h-5 w-5 text-cyan-500 mb-1" />
                    <span className="text-[11px] font-sans">Afternoon</span>
                    <span className="font-mono text-[8px] text-slate-400 uppercase mt-0.5 font-bold">1pm - 5pm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnergyPreference('evening')}
                    className={`btn-animate flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                      energyPreference === 'evening'
                        ? 'border-purple-300 bg-purple-50/50 text-purple-950 font-bold shadow-md shadow-purple-100/40'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/30'
                    }`}
                  >
                    <Moon className="h-5 w-5 text-purple-500 mb-1" />
                    <span className="text-[11px] font-sans">Evening</span>
                    <span className="font-mono text-[8px] text-slate-400 uppercase mt-0.5 font-bold">6pm - 10pm</span>
                  </button>
                </div>
              </div>

              {/* Core Focus Goal */}
              <div>
                <label htmlFor="signup-goal" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Focus Goal / Purpose
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute top-3.5 left-3.5">
                    <Target className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    id="signup-goal"
                    name="goal"
                    rows={2}
                    required
                    value={focusGoal}
                    onChange={(e) => setFocusGoal(e.target.value)}
                    placeholder="e.g. Build my fitness startup or pass my university coding finals while maintaining work-life balance."
                    className="block w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-animate flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-100/50 hover:bg-teal-500 active:scale-95 cursor-pointer"
                >
                  Create Account & Start
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white text-slate-400 px-3 font-mono">OR</span>
            </div>
          </div>

          {/* Quick Demo Option */}
          <button
            onClick={handleQuickTrial}
            className="btn-animate flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-200 hover:border-teal-300 bg-teal-50/20 py-3 px-4 text-xs font-bold text-teal-700 transition-colors duration-200 cursor-pointer hover:shadow-md"
          >
            <Shield className="h-4 w-4 text-teal-500 animate-pulse" />
            Launch Instant Demo Account
          </button>

        </div>
      </div>
    </div>
  );
}
