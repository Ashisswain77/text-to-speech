import React, { useState } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export default function Header({ onToggleSidebar, isSidebarOpen, onSelectTab }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        <button 
          type="button"
          onClick={() => onSelectTab('create')}
          className="focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-2 py-1 transition-all hover:scale-105 active:scale-95"
        >
          <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            SpeechEngine
          </span>
        </button>
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
              flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500
              ${showProfileMenu 
                ? 'bg-slate-100 dark:bg-slate-800 border border-brand-400/80 dark:border-brand-500/80 ring-2 ring-brand-500/20 shadow-sm' 
                : 'border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                AV
              </div>
              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Alexander Vance
            </span>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''}`} />
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
