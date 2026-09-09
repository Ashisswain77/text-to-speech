import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function GenerateButton({
  onClick,
  isLoading = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        w-full sm:w-auto min-w-[200px] px-7 py-3 rounded-xl font-semibold text-sm
        flex items-center justify-center gap-2.5 transition-all duration-150
        focus:outline-none focus:ring-4 focus:ring-brand-500/25 active:scale-[0.99]
        ${disabled
          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none'
          : isLoading
            ? 'bg-brand-600 text-white cursor-wait opacity-90'
            : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow shadow-brand-600/20'
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating Speech...</span>
        </>
      ) : (
        <>
          <Sparkles className={`w-4 h-4 ${disabled ? 'text-slate-300 dark:text-slate-600' : 'text-brand-200'}`} />
          <span>Generate Speech</span>
        </>
      )}
    </button>
  );
}
