import React from 'react';

export default function Hero() {
  return (
    <div className="relative mb-8 md:mb-10 pt-2 text-center">
      {/* Subtle ambient decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-400/10 dark:bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Heading with Outfit display font and gradient accent */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Turn your written words into{' '}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
            natural speech.
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-2xl">
          Convert scripts into hyper-realistic, expressive voiceovers with expressive cadence and multi-lingual neural accents.
        </p>
      </div>
    </div>
  );
}
