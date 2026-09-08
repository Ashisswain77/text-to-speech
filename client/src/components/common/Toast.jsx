import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message = "Speech generated successfully.", onClose }) {
  return (
    <div 
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-slate-100">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="ml-2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
