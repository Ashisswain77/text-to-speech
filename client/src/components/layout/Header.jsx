import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
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

export default function Header({ onToggleSidebar, isSidebarOpen, onSelectTab }) {
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Studio User';
  const initials = getUserInitials(user?.name, user?.email);


  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-150 relative">
      {/* Left: 3-bar navigation button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          title={isSidebarOpen ? "Close menu" : "Open menu"}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all active:scale-90"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Website Name only (no icon image) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <Link 
          to="/"
          onClick={() => {
            if (onSelectTab) onSelectTab('create');
          }}
          className="focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-2 py-1 transition-all hover:scale-105 active:scale-95"
        >
          <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            SpeechEngine
          </span>
        </Link>
      </div>

      {/* Right: Animated User Profile Menu with internal theme toggle */}
      <div className="flex items-center ml-auto">
        {/* User Profile Trigger Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-expanded={showProfileMenu}
            aria-label="Toggle user account menu"
            className={`
              group flex items-center gap-2.5 py-1 px-1.5 pr-3 rounded-full transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500/40
              ${showProfileMenu 
                ? 'bg-brand-50/80 dark:bg-slate-800/90 border border-brand-500/60 ring-2 ring-brand-500/20 shadow-sm shadow-brand-500/10' 
                : 'bg-white/80 dark:bg-slate-850/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-750/90 hover:bg-slate-50/90 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
              }
            `}
          >
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 via-brand-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/40 dark:ring-white/10">
                {initials}
              </div>
              {/* Pulsing online indicator dot */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </span>
            </div>

            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[130px] tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
              {displayName}
            </span>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 group-hover:text-slate-600 dark:group-hover:text-slate-200 ${showProfileMenu ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''}`} />
          </button>

          {/* Animated Profile Menu Dropdown */}
          {showProfileMenu && (
            <ProfileMenu 
              onClose={() => setShowProfileMenu(false)} 
              onSelectTab={onSelectTab}
            />
          )}
        </div>
      </div>
    </header>
  );
}
