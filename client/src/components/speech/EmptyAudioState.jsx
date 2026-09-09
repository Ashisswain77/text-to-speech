import React from 'react';
import { Activity } from 'lucide-react';

export default function EmptyAudioState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 text-center flex flex-col items-center justify-center transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-700">
        <Activity className="w-6 h-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Your generated audio will appear here.
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
        Type your text, choose a language and voice, then click Generate Speech to synthesize audio.
      </p>
    </div>
  );
}
