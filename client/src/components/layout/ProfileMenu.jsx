import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Sun, 
  Moon,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

function getUserInitials(name, email) {
  if (name && typeof name === 'string') {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && typeof email === 'string') {
    return email.slice(0, 2).toUpperCase();
  }
  return 'SE';
}

export default function ProfileMenu({ onClose, onSelectTab }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Studio User';
  const displayEmail = user?.email || '';
  const initials = getUserInitials(user?.name, user?.email);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      onClose();
      navigate('/login');
    }
  };

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Click-outside Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Modern Glassmorphic Dropdown Menu Card */}
      <div 
        role="menu"
        aria-label="User Account Menu"
        className="
          absolute right-0 mt-3 w-80
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl
          rounded-2xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)]
          border border-slate-200/80 dark:border-slate-800/80
          p-2.5 z-50 origin-top-right
          animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out
        "
      >
        {/* User Identity Header Card */}
        <div className="p-3.5 rounded-xl bg-slate-50/75 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/70 mb-2">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-brand-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-brand-500/25 ring-2 ring-white dark:ring-slate-800">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {displayEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Theme Switcher Row */}
        <div className="px-2.5 py-2 flex items-center justify-between rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors mb-1">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              theme === 'dark'
                ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30'
                : 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
            }`}>
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Appearance
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {theme === 'dark' ? 'Dark theme active' : 'Light theme active'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40
              ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}
            `}
          >
            <span
              className={`
                inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white transition-transform duration-200 shadow-sm
                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
              `}
            >
              {theme === 'dark' ? (
                <Moon className="w-2.5 h-2.5 text-indigo-600" />
              ) : (
                <Sun className="w-2.5 h-2.5 text-amber-500" />
              )}
            </span>
          </button>
        </div>

        {/* Navigation Items with Icon Tiles and Micro-interactions */}
        <div className="space-y-1">
          <Link
            to="/settings"
            onClick={() => {
              if (onSelectTab) onSelectTab('settings');
              onClose();
            }}
            className="group w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:scale-105 transition-all">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  User Profile
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Account details & security
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/settings"
            onClick={() => {
              if (onSelectTab) onSelectTab('settings');
              onClose();
            }}
            className="group w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:scale-105 transition-all">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Settings & Preferences
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Voice defaults & export format
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Log Out Action Button */}
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 mt-1.5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-red-50/90 dark:hover:bg-red-950/40 transition-all duration-150 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100/90 dark:bg-red-950/70 border border-red-200/70 dark:border-red-900/60 flex items-center justify-center text-red-700 dark:text-red-400 group-hover:bg-red-200/90 dark:group-hover:bg-red-900/80 group-hover:scale-105 transition-all">
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-700 dark:text-red-400" />
                ) : (
                  <LogOut className="w-4 h-4 text-red-700 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300 transition-colors">
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </p>
                <p className="text-[11px] font-medium text-red-600/90 dark:text-red-400/90 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                  End active studio session
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
