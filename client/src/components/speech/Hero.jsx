import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <div className="mb-6 md:mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        <span>Neural Voice Studio</span>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        Turn your words into speech.
      </h1>
      <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
        Convert text into natural-sounding speech in seconds. Choose from multi-lingual neural voices with fine-tuned pitch, cadence, and expression.
      </p>
    </div>
  );
}
