import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell({ activeTab, onSelectTab, children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top persistent header */}
      <Header 
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
