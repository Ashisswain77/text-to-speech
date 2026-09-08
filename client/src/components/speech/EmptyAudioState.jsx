import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';

export default function EmptyAudioState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 sm:p-10 text-center flex flex-col items-center justify-center transition-all hover:border-slate-300">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3.5 shadow-inner">
        <Volume2 className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        Your generated audio will appear here
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1">
        Type or paste your text above, choose a language and voice, then click Generate Speech to produce natural audio.
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Supports MP3 audio preview & instant download</span>
      </div>
    </div>
  );
}
