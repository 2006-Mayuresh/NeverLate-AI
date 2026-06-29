import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { User } from './types';
import { getCurrentUser } from './services/localDb';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Load current user session on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div id="loading-spinner-container" className="min-h-screen bg-slate-50 dark:bg-[#070b19] flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600"></div>
          <p className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Syncing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/35 dark:bg-[#070b19] text-slate-900 dark:text-slate-100 selection:bg-cyan-200/40 transition-colors duration-300">
      {currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} theme={theme} onToggleTheme={toggleTheme} />
      )}
    </div>
  );
}
