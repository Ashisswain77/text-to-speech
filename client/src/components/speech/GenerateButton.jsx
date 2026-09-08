import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function GenerateButton({
  onClick,
  isLoading = false,
  disabled = false,
  charCount = 0,
}) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`
          w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl font-semibold text-sm sm:text-base
          flex items-center justify-center gap-2.5 shadow-md transition-all duration-150
          focus:outline-none focus:ring-4 focus:ring-brand-500/25 active:scale-[0.99]
          ${disabled || isLoading
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating Speech...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-brand-200" />
            <span>Generate Speech</span>
          </>
        )}
      </button>
    </div>
  );
}
