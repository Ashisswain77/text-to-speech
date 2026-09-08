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
      relative rounded-2xl bg-white border transition-all duration-200 shadow-card
      ${isOverLimit 
        ? 'border-red-400 ring-2 ring-red-100' 
        : isNearLimit 
          ? 'border-amber-300 ring-2 ring-amber-50' 
          : 'border-slate-200 hover:border-slate-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10'
      }
    `}>
      {/* Loading Overlay state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] rounded-2xl z-10 flex flex-col items-center justify-center gap-2.5">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Synthesizing audio preview...</span>
        </div>
      )}

      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 text-xs font-medium text-slate-500">
        <label htmlFor="tts-text-editor" className="font-semibold text-slate-700 tracking-wide uppercase text-[11px]">
          Script Input
        </label>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
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
            w-full resize-y bg-transparent border-0 p-0 text-slate-800 placeholder:text-slate-400
            text-base sm:text-lg leading-relaxed focus:ring-0 focus:outline-none disabled:opacity-60
          `}
        />
      </div>

      {/* Character limit exceeded alert banner if applicable */}
      {isOverLimit && (
        <div className="mx-5 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>Text exceeds 5,000 character limit by {charCount - MAX_CHARS} characters.</span>
        </div>
      )}

      {/* Editor Footer: Clear Action & Counters */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl">
        {/* Left: Clear button */}
        <div>
          <button
            type="button"
            onClick={onClear}
            disabled={charCount === 0 || isLoading}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${charCount === 0 || isLoading
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400'
              }
            `}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Right: Word and Character counts */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500 font-medium">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>

          <span className={`
            font-semibold px-2 py-0.5 rounded-md transition-colors
            ${isOverLimit 
              ? 'bg-red-100 text-red-700 font-bold' 
              : isNearLimit 
                ? 'bg-amber-100 text-amber-800' 
                : 'text-slate-600'
            }
          `}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
          </span>
        </div>
      </div>
    </div>
  );
}
