import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const MAX_CHARS = 5000;
const NEAR_LIMIT_THRESHOLD = 4500;

export default function TextEditor({
  text = '',
  onChange,
  onClear,
  isLoading = false,
  isReadOnly = false,
}) {
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const isNearLimit = charCount >= NEAR_LIMIT_THRESHOLD && charCount <= MAX_CHARS;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className={`
      relative rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-card
      ${isOverLimit 
        ? 'border-red-400 dark:border-red-500 ring-2 ring-red-100 dark:ring-red-950/50' 
        : isNearLimit 
          ? 'border-amber-300 dark:border-amber-500 ring-2 ring-amber-50 dark:ring-amber-950/50' 
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-brand-500 dark:focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:focus-within:ring-brand-500/20'
      }
    `}>
      {/* Loading Overlay state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/75 dark:bg-slate-900/80 backdrop-blur-[1px] rounded-2xl z-10 flex flex-col items-center justify-center gap-2.5">
          <Loader2 className="w-6 h-6 text-brand-600 dark:text-brand-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Synthesizing audio preview...</span>
        </div>
      )}

      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
        <label htmlFor="tts-text-editor" className="font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase text-[11px]">
          Script Input
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
          Plain text or markdown supported
        </span>
      </div>

      {/* Main Textarea */}
      <div className="p-4 sm:p-5">
        <textarea
          id="tts-text-editor"
          value={text}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder="Write or paste your text..."
          disabled={isLoading || isReadOnly}
          rows={7}
          className={`
            w-full resize-y bg-transparent border-0 p-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
            text-base sm:text-lg leading-relaxed focus:ring-0 focus:outline-none disabled:opacity-60
          `}
        />
      </div>

      {/* Character limit exceeded alert banner if applicable */}
      {isOverLimit && (
        <div className="mx-5 mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>Text exceeds 5,000 character limit by {charCount - MAX_CHARS} characters.</span>
        </div>
      )}

      {/* Editor Footer: Clear Action & Counters */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        {/* Left: Clear button */}
        <div>
          <button
            type="button"
            onClick={onClear}
            disabled={charCount === 0 || isLoading}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${charCount === 0 || isLoading
                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-400'
              }
            `}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Right: Word and Character counts */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>

          <span className={`
            font-semibold px-2 py-0.5 rounded-md transition-colors
            ${isOverLimit 
              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold' 
              : isNearLimit 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                : 'text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80'
            }
          `}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
          </span>
        </div>
      </div>
    </div>
  );
}
