import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Sparkles, 
  History, 
  Star, 
  Settings, 
  X, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onSelectTab }) {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Main navigation items
  const exploreItems = [
    { 
      id: 'create', 
      path: '/',
      label: 'Create Speech', 
      icon: Sparkles,
    },
    { 
      id: 'history', 
      path: '/history',
      label: 'Speech History', 
      icon: History, 
    },
    { 
      id: 'favorites', 
      path: '/favorites',
      label: 'Starred Favorites', 
      icon: Star, 
    },
    { 
      id: 'settings', 
      path: '/settings',
      label: 'Studio Settings', 
      icon: Settings 
    },
  ];

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div 
        className={`
          fixed inset-0 z-40 bg-slate-950/40 dark:bg-black/70 backdrop-blur-xs
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Sliding Off-Canvas Drawer */}
      <aside 
        aria-label="Sidebar navigation"
        className={`
          fixed inset-y-0 left-0 z-50
          w-[300px] sm:w-[340px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          shadow-2xl flex flex-col justify-between
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Upper section */}
        <div className="overflow-y-auto">
          {/* Drawer Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800">
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              SpeechEngine
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              title="Close menu"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links - Matching the Reference Image style */}
          <div className="p-5">
            {/* Primary EXPLORE Section */}
            <div>
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                EXPLORE
              </div>

              <nav className="divide-y divide-slate-100/80 dark:divide-slate-800/80" aria-label="Explore Menu">
                {exploreItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      end
                      onClick={() => {
                        onClose();
                        if (onSelectTab) onSelectTab(item.id);
                      }}
                      className={({ isActive }) => `
                        group w-full flex items-center justify-between py-3.5 px-3 rounded-xl transition-all duration-150 text-left
                        ${isActive 
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-brand-600 dark:text-brand-400 font-semibold' 
                          : 'text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                              isActive 
                                ? 'text-brand-600 dark:text-brand-400' 
                                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                            }`} />
                            <span className="text-[16px] sm:text-[17px] font-medium tracking-tight truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-brand-600 text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.count && (
                              <span className="font-mono text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {item.count}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Lower section / Studio Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="font-medium">SpeechEngine Studio</span>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Docs</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
