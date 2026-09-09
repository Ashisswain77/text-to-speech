import React, { useState } from 'react';
import { Bell, Menu, Sun, Moon } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ onToggleMobileSidebar, onSelectTab }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-150 relative">
      {/* Left: Mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Website Name only (no icon image) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <button 
          type="button"
          onClick={() => onSelectTab('create')}
          className="focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-2 py-1 transition-opacity hover:opacity-85"
        >
          <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            SpeechEngine
          </span>
        </button>
      </div>

      {/* Right: Theme Toggle, Notifications & User Profile */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Quick Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-slate-500 hover:text-slate-800 transition-colors" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Notifications Dropdown Preview */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notifications</span>
                <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">1 new</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">Welcome to SpeechEngine</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore 7+ languages and high-fidelity neural voices.</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            aria-label="User account menu"
            className="flex items-center gap-2.5 p-1 pl-2 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              AV
            </div>
            <span className="hidden md:inline-block text-xs font-medium text-slate-700 dark:text-slate-200">
              Alexander Vance
            </span>
          </button>

          {/* Profile Menu Dropdown */}
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
