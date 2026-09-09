import React from 'react';
import { User, Settings, LogOut, ShieldCheck } from 'lucide-react';

export default function ProfileMenu({ onClose, onSelectTab }) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
        {/* User Identity Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-semibold text-sm flex items-center justify-center shadow-sm">
              AV
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Alexander Vance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">alex@vocalis.ai</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 bg-brand-50 dark:bg-brand-950/60 rounded-lg text-brand-700 dark:text-brand-300 text-[11px] font-medium border border-brand-100/60 dark:border-brand-800/50">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Intermediate Tier · 5,000 Chars/req</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-1 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSelectTab('settings');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
          >
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span>User Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('settings');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span>Settings & Preferences</span>
          </button>
        </div>

        {/* Log Out Placeholder */}
        <div className="p-1 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
          <button
            type="button"
            onClick={() => {
              alert("Authentication placeholder: Log out will be connected in subsequent phase.");
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );
}
