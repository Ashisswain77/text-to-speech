import React, { useState } from 'react';
import { Sliders, Eye, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

export default function StateControllerToolbar({
  onSetEditorState,
  onToggleLoading,
  isLoading,
  onToggleAudioResult,
  hasAudioResult,
  onSetErrorType,
  errorType,
  onTriggerToast,
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 shadow-elevated border border-indigo-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300">
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase text-indigo-200">
            Day 2 UI State Inspector
          </span>
          <span className="hidden sm:inline text-[11px] text-indigo-300/80 bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-700/40">
            Preview all required UI states
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <span>{isOpen ? 'Minimize Inspector' : 'Expand Inspector'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-indigo-900/60 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Text Editor States */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Editor:</span>
            <button
              type="button"
              onClick={() => onSetEditorState('empty')}
              className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-200 font-medium"
            >
              Empty
            </button>
            <button
              type="button"
              onClick={() => onSetEditorState('entered')}
              className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-200 font-medium"
            >
              Entered
            </button>
            <button
              type="button"
              onClick={() => onSetEditorState('near_limit')}
              className="px-2 py-1 rounded-lg hover:bg-amber-500/20 text-amber-300 font-medium"
            >
              Near Limit
            </button>
            <button
              type="button"
              onClick={() => onSetEditorState('over_limit')}
              className="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-rose-300 font-medium"
            >
              Over Limit
            </button>
          </div>

          {/* Loading / Generating State */}
          <button
            type="button"
            onClick={onToggleLoading}
            className={`px-3 py-1.5 rounded-xl border transition-colors font-medium flex items-center gap-1.5 ${
              isLoading 
                ? 'bg-brand-500 border-brand-400 text-white' 
                : 'bg-black/30 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            <span>{isLoading ? 'Stop Loading' : 'Toggle Loading State'}</span>
          </button>

          {/* Audio Result Toggle */}
          <button
            type="button"
            onClick={onToggleAudioResult}
            className={`px-3 py-1.5 rounded-xl border transition-colors font-medium flex items-center gap-1.5 ${
              hasAudioResult 
                ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200' 
                : 'bg-black/30 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            <span>{hasAudioResult ? 'Audio: Generated' : 'Audio: Empty State'}</span>
          </button>

          {/* Error Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Error:</span>
            <select
              value={errorType || 'none'}
              onChange={(e) => onSetErrorType(e.target.value === 'none' ? null : e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="none" className="bg-slate-900 text-white">None</option>
              <option value="empty_text" className="bg-slate-900 text-white">Empty Text</option>
              <option value="limit_exceeded" className="bg-slate-900 text-white">Limit Exceeded</option>
              <option value="generation_failure" className="bg-slate-900 text-white">Generation Failed</option>
              <option value="network_failure" className="bg-slate-900 text-white">Network Error</option>
              <option value="auth_failure" className="bg-slate-900 text-white">Request Error</option>
            </select>
          </div>

          {/* Trigger Toast */}
          <button
            type="button"
            onClick={onTriggerToast}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/30 border border-indigo-400/40 hover:bg-indigo-500/40 text-indigo-200 font-medium flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Show Toast</span>
          </button>
        </div>
      )}
    </div>
  );
}
