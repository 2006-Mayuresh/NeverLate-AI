import React, { useState } from 'react';
import { registerUser, loginUser, getUsers } from '../services/localDb';
import { User } from '../types';
import { Sparkles, ArrowRight, Sun, Sunset, Moon, Target, Mail, Shield, User as UserIcon, Lock } from 'lucide-react';

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
  const [password, setPassword] = useState('');

  // Google Sign-In in-page modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showGoogleCustomInput, setShowGoogleCustomInput] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
    setShowGoogleCustomInput(false);
    setGoogleName('');
    setGoogleEmail('');
  };

  const handleGoogleSelectAccount = async (gName: string, gEmail: string) => {
    try {
      setError('');
      const response = await fetch('/api/users/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: gName, email: gEmail })
      });
      
      if (!response.ok) {
        throw new Error('Google authentication failed');
      }
      
      const user = await response.json();
      localStorage.setItem('neverlate_current_user', JSON.stringify(user));
      onAuthSuccess(user);
    } catch (e: any) {
      setError(e.message || 'Failed to authenticate with Google.');
      setShowGoogleModal(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      const user = await loginUser(email, password);
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

    if (!email || !name || !focusGoal || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      const user = await registerUser(name, email, energyPreference, focusGoal, password);
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
        'Pass my university finals and optimize my daily study schedule.',
        'demo123'
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
              onClick={() => { setIsSignUp(false); setError(''); setPassword(''); }}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-slate-900 shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); setPassword(''); }}
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
                <label htmlFor="signin-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative rounded-2xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="btn-animate flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 py-3.5 px-4 text-sm font-bold text-slate-700 shadow-sm cursor-pointer transition-all duration-200"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
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

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100/50 focus:bg-white"
                  />
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

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="btn-animate flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 py-3.5 px-4 text-sm font-bold text-slate-700 shadow-sm cursor-pointer transition-all duration-200"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Create Account with Google
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

          {/* Google Authentication Modal Overlay */}
          {showGoogleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowGoogleModal(false)} />
              
              <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-900 z-50 p-8 text-center animate-in zoom-in-95 duration-200">
                {/* Google Logo */}
                <div className="flex justify-center mb-6">
                  <svg className="h-6" viewBox="0 0 74 24" width="75" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.465 1.908 15.63 0 12.24 0 5.48 0 0 5.37 0 12s5.48 12 12.24 12c7.058 0 11.758-4.887 11.758-11.77 0-.79-.086-1.393-.19-1.945H12.24z" fill="#4285F4"/>
                    <path d="M33.456 8.243c-3.792 0-6.837 2.87-6.837 6.757s3.045 6.757 6.837 6.757c3.793 0 6.838-2.87 6.838-6.757S37.25 8.243 33.456 8.243zm0 10.743c-2.124 0-3.957-1.737-3.957-3.986s1.833-3.986 3.957-3.986c2.124 0 3.957 1.737 3.957 3.986s-1.833 3.986-3.957 3.986z" fill="#EA4335"/>
                    <path d="M49.49 8.243c-3.792 0-6.838 2.87-6.838 6.757s3.046 6.757 6.838 6.757c3.793 0 6.838-2.87 6.838-6.757s-3.045-6.757-6.838-6.757zm0 10.743c-2.124 0-3.957-1.737-3.957-3.986s1.833-3.986 3.957-3.986c2.124 0 3.957 1.737 3.957 3.986s-1.833 3.986-3.957 3.986z" fill="#F9BC05"/>
                    <path d="M65.056 8.243c-3.67 0-6.666 2.92-6.666 6.757 0 3.803 2.996 6.757 6.666 6.757 2.22 0 3.526-.887 4.317-1.815V21c0 2.576-1.41 3.97-3.684 3.97-1.858 0-3.012-1.31-3.442-2.4l-3.593 1.487C59.697 26.545 61.9 29 65.688 29c4.2 0 7.76-2.435 7.76-8.835V8.65h-4.07v1.58c-.91-.974-2.316-1.987-4.322-1.987zm.4 10.743c-2.073 0-3.717-1.737-3.717-3.986s1.644-3.986 3.717-3.986c2.073 0 3.65 1.737 3.65 3.986s-1.577 3.986-3.65 3.986z" fill="#4285F4"/>
                  </svg>
                </div>

                {!showGoogleCustomInput ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-sans">Choose an account</h3>
                    <p className="text-xs text-slate-500 font-medium">to continue to NeverLate AI</p>

                    {/* Account list */}
                    <div className="text-left mt-6 divide-y divide-slate-100 dark:divide-slate-900">
                      <button
                        type="button"
                        onClick={() => handleGoogleSelectAccount('Mayuresh Kharat', 'mayuresh.kharat@gmail.com')}
                        className="w-full flex items-center gap-3 py-3.5 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all cursor-pointer text-left border border-transparent"
                      >
                        <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          M
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">Mayuresh Kharat</div>
                          <div className="text-[10px] font-bold text-slate-400 truncate">mayuresh.kharat@gmail.com</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGoogleSelectAccount('Demo Tester', 'demo.tester@gmail.com')}
                        className="w-full flex items-center gap-3 py-3.5 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all cursor-pointer text-left border border-transparent"
                      >
                        <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          D
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">Demo Tester</div>
                          <div className="text-[10px] font-bold text-slate-400 truncate">demo.tester@gmail.com</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGoogleCustomInput(true)}
                        className="w-full flex items-center gap-3 py-3.5 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all cursor-pointer text-left border border-transparent"
                      >
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 flex items-center justify-center font-bold text-lg shrink-0">
                          +
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-blue-600 dark:text-blue-400">Use another account</div>
                          <div className="text-[10px] font-bold text-slate-400">Sign in with a different email</div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-left space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-sans text-center">Google Sign in</h3>
                    
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (googleName && googleEmail) {
                          handleGoogleSelectAccount(googleName, googleEmail);
                        }
                      }}
                      className="space-y-4 pt-4"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={googleName}
                          onChange={(e) => setGoogleName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-800 dark:text-slate-200 bg-transparent outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">Google Email Address</label>
                        <input
                          type="email"
                          required
                          value={googleEmail}
                          onChange={(e) => setGoogleEmail(e.target.value)}
                          placeholder="name@gmail.com"
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-800 dark:text-slate-200 bg-transparent outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-4">
                        <button
                          type="button"
                          onClick={() => setShowGoogleCustomInput(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          Back
                        </button>
                        
                        <button
                          type="submit"
                          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold cursor-pointer transition-colors shadow-md"
                        >
                          Next
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 mt-8 leading-relaxed">
                  To continue, Google will share your name, email address, language preference, and profile picture with NeverLate AI.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
