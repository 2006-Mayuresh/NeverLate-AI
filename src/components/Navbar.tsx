import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, LogOut, ChevronDown, Award, Clock, Sun, Moon } from 'lucide-react';
import { logoutUser } from '../services/localDb';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  focusRating: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Navbar({ user, onLogout, focusRating, theme, onToggleTheme }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Simple avatar generator based on first character of name
  const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const handleLogoutClick = () => {
    logoutUser();
    onLogout();
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-lime-400 text-white shadow-lg shadow-cyan-200/50 group-hover:scale-110 group-hover:shadow-cyan-300/60 duration-300 animate-float">
            <Sparkles className="h-5.5 w-5.5 animate-pulse text-white" />
          </div>
          <div>
            <h1 className="font-sans text-xl font-black tracking-tight text-slate-800 leading-none">
              NeverLate <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-lime-500 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="font-mono text-[9px] text-slate-400 font-extrabold tracking-wider mt-1">SMART SCHEDULER</p>
          </div>
        </div>

        {/* Focus Rating & Theme Toggle & User Account Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Focus Score Indicator */}
          <div className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50/80 border border-teal-100/80 px-4 py-2 sm:flex shadow-sm hover:shadow-cyan-100/40 duration-300 hover:-translate-y-0.5">
            <Award className="h-4 w-4 text-teal-600 animate-pulse" />
            <span className="text-xs font-bold text-teal-800">
              Focus Health: {focusRating}%
            </span>
          </div>

          {/* Clean and Prominent Theme Toggle Button */}
          <button
            id="theme-toggle-button"
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="btn-animate flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50/60 hover:bg-white border border-slate-100 hover:border-cyan-200 text-slate-600 hover:text-cyan-600 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
          >
            {theme === 'light' ? (
              <Moon className="h-4.5 w-4.5 text-slate-600" />
            ) : (
              <Sun className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
            )}
          </button>

          <div className="relative">
            <button
              id="profile-menu-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-2xl p-1.5 transition-all duration-300 hover:bg-white border border-slate-100 hover:border-cyan-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              {/* Avatar Icon */}
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-lime-400 font-sans text-sm font-black text-white shadow-md shadow-cyan-100/40">
                {initials}
              </div>
              
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[100px]">{user.name}</p>
                <p className="font-mono text-[9px] text-slate-400 capitalize font-semibold">{user.energyPreference} Peak</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2.5 w-60 origin-top-right rounded-3xl border border-slate-100 bg-white p-2.5 shadow-2xl ring-1 ring-black/5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {/* User Profile Summary */}
                  <div className="px-3 py-3 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider">LOGGED IN AS</p>
                    <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user.email}</p>
                    <div className="mt-2.5 rounded-2xl bg-slate-50/80 p-3 border border-slate-100/60 shadow-inner">
                      <p className="font-mono text-[9px] font-bold text-slate-500">FOCUS GOAL</p>
                      <p className="text-xs text-slate-600 line-clamp-3 mt-1 leading-relaxed italic">
                        "{user.focusGoal}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-2">
                    <button
                      onClick={handleLogoutClick}
                      className="btn-animate flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50/70 transition-colors duration-150 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
