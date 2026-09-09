import React, { useState } from 'react';
import { Wrench, X, Bell, Network, Layers } from 'lucide-react';
import RestApiDemo from '../dev/RestApiDemo';

/**
 * DEVELOPMENT ONLY COMPONENT
 * Provides development inspection tools:
 * 1. Day 6 REST API Communication Tester (fetch helper, GET, POST, errors)
 * 2. Day 2 UI State Inspector (Mock visual states)
 * 
 * Can be completely disabled via ENABLE_DEV_INSPECTOR flag in CreateSpeechPage.
 */
export default function StateControllerToolbar({
  onSetEditorState,
  onToggleLoading,
  isLoading,
  onSetAudioState,
  audioState, // 'empty' | 'generated' | 'loading'
  onSetErrorType,
  errorType,
  onTriggerToast,
  currentText = '',
  currentLanguage = 'en-US',
  currentVoice = 'sarah',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('rest'); // 'rest' | 'ui'

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans">
      {/* Minimized Pill Toggle */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white rounded-full text-xs font-semibold shadow-lg border border-slate-700/80 backdrop-blur-md transition-all hover:scale-105"
          title="Open Dev Inspector & REST API Tester"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Dev Inspector (Day 6 REST)</span>
        </button>
      ) : (
        /* Expanded Floating Dev Drawer */
        <div className="w-[360px] sm:w-[500px] bg-slate-950/95 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                Dev Tool
              </span>
              <h3 className="text-xs font-bold text-white tracking-wide">
                Development Inspector & API Tester
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 pt-3 pb-3 border-b border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('rest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'rest'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Day 6: REST API Tester</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ui')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'ui'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Day 2: UI States</span>
            </button>
          </div>

          {/* Tab 1: Day 6 REST API Tester */}
          {activeTab === 'rest' && (
            <div className="pt-2">
              <RestApiDemo
                sampleText={currentText}
                currentLanguage={currentLanguage}
                currentVoice={currentVoice}
              />
            </div>
          )}

          {/* Tab 2: Day 2 UI States */}
          {activeTab === 'ui' && (
            <div className="pt-2 space-y-3 text-xs">
              <p className="text-[11px] text-slate-400 mb-2">
                Preview visual mock states without backend APIs:
              </p>

              {/* 1. Text Editor States */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  1. Text Editor Input State:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSetEditorState('empty')}
                    className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Empty (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetEditorState('entered')}
                    className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Entered
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetEditorState('near_limit')}
                    className="px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-[11px] font-medium text-amber-300 transition-colors"
                  >
                    Near Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetEditorState('over_limit')}
                    className="px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-[11px] font-medium text-rose-300 transition-colors"
                  >
                    Over Limit
                  </button>
                </div>
              </div>

              {/* 2. Audio Result Section State */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  2. Audio Output State:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSetAudioState('empty')}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                      audioState === 'empty'
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    Empty State
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetAudioState('generated')}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                      audioState === 'generated'
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    Generated Card
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetAudioState('loading')}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                      audioState === 'loading'
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    Loading Shimmer
                  </button>
                </div>
              </div>

              {/* 3. Generate Button Loading Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-300 font-medium">
                  Button Loading State:
                </span>
                <button
                  type="button"
                  onClick={onToggleLoading}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    isLoading
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {isLoading ? 'Loading Active (Stop)' : 'Preview Loading State'}
                </button>
              </div>

              {/* 4. Error Banners & Toast */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Error:</span>
                  <select
                    value={errorType || 'none'}
                    onChange={(e) => onSetErrorType(e.target.value === 'none' ? null : e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="empty_text">Empty Input Error</option>
                    <option value="limit_exceeded">Limit Exceeded Error</option>
                    <option value="generation_failure">Generation Failed Error</option>
                    <option value="network_failure">Network Offline Error</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={onTriggerToast}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs rounded-lg transition-colors"
                  title="Preview Success Toast"
                >
                  <Bell className="w-3 h-3 text-emerald-400" />
                  <span>Trigger Toast</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
