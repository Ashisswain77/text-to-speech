import React, { useState } from 'react';
import { Volume2, Bell, Menu, Sparkles, Check } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export default function Header({ onToggleMobileSidebar, activeTab, onSelectTab }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      {/* Left: Mobile menu toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button 
          onClick={() => onSelectTab('create')}
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg py-1 px-1.5 -ml-1.5"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30 group-hover:bg-brand-700 transition-colors">
            <Volume2 className="w-4.5 h-4.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-slate-900">Vocalis</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full border border-brand-100">
              Studio
            </span>
          </div>
        </button>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown Preview */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-elevated border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notifications</span>
                <span className="text-xs text-brand-600 font-medium">1 new</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-900">Welcome to Vocalis Studio</p>
                      <p className="text-xs text-slate-500 mt-0.5">Explore 7+ languages and high-fidelity neural voices.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
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
            className="flex items-center gap-2.5 p-1 pl-2 pr-2.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              AV
            </div>
            <span className="hidden md:inline-block text-xs font-medium text-slate-700">
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
