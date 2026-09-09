import React from 'react';
import { 
  Sparkles, 
  History, 
  Star, 
  Settings, 
  X, 
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const navItems = [
    { 
      id: 'create', 
      label: 'Create Speech', 
      icon: Sparkles,
      badge: 'New'
    },
    { 
      id: 'history', 
      label: 'Speech History', 
      icon: History, 
      count: '14'
    },
    { 
      id: 'favorites', 
      label: 'Favorites', 
      icon: Star, 
      count: '5'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings 
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800
          flex flex-col justify-between
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Upper section */}
        <div>
          {/* Mobile Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                S
              </div>
              <span className="font-bold text-slate-900 dark:text-white">SpeechEngine</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
            <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-xs border border-brand-100/70 dark:border-brand-800/60 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-brand-600 text-white">
                      {item.badge}
                    </span>
                  )}

                  {item.count && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive 
                        ? 'bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-200' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower section / Studio Info Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-transparent dark:border-slate-800 text-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
                Plan Limit
              </span>
              <span className="text-[10px] font-medium bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                Intermediate
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-200 mb-1.5">
              <span>Characters used</span>
              <span className="font-semibold text-white">12,450 / 50,000</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full w-[25%]" />
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-slate-400 dark:text-slate-500">
            <span>SpeechEngine</span>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Docs</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
