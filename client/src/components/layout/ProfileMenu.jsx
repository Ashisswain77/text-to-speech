import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
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
  const tierName = user?.tier ? `${user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier` : 'Free Tier';
  const charLimitFormatted = user?.charLimit ? `${(user.charLimit / 1000).toFixed(0)}k chars/req` : '5k chars/req';

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

      {/* Animated Dropdown Menu */}
      <div 
        role="menu"
        aria-label="User Account Menu"
        className="
          absolute right-0 mt-2.5 w-72 sm:w-80
          bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
          border border-slate-200/90 dark:border-slate-800
          p-2 z-50 origin-top-right
          animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150
        "
      >
        {/* User Identity Header Card */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-bold text-sm flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Tier Status Badge */}
          <div className="mt-3 flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-brand-50/80 dark:bg-brand-950/60 rounded-lg text-brand-700 dark:text-brand-300 text-[11px] font-semibold border border-brand-100 dark:border-brand-800/50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <span>{tierName}</span>
            </div>
            <span className="font-mono text-[10px] text-brand-600/80 dark:text-brand-400/80 font-medium">
              {charLimitFormatted}
            </span>
          </div>
        </div>

        {/* Quick Theme Switcher Row */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500
              ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm
                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Navigation Items with Slide Hover Animations */}
        <div className="space-y-0.5">
          <Link
            to="/settings"
            onClick={() => {
              if (onSelectTab) onSelectTab('settings');
              onClose();
            }}
            className="group w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl transition-all duration-150 text-left"
          >
            <div className="flex items-center gap-2.5 group-hover:translate-x-1 transition-transform duration-150">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
              <span>User Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/settings"
            onClick={() => {
              if (onSelectTab) onSelectTab('settings');
              onClose();
            }}
            className="group w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl transition-all duration-150 text-left"
          >
            <div className="flex items-center gap-2.5 group-hover:translate-x-1 transition-transform duration-150">
              <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
              <span>Settings & Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Log Out Button */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all duration-150 text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 group-hover:translate-x-1 transition-transform duration-150">
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 text-rose-500 dark:text-rose-400 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              )}
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
