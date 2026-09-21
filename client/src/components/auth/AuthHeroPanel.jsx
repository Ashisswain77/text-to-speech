import React from 'react';
import { Check, Mic } from 'lucide-react';

/**
 * Full-screen light-themed hero panel layout for authentication pages.
 * The hero panel covers the entire screen, with the rich hero showcase on the left
 * and the login/register box anchored on the right.
 */
export default function AuthHeroPanel({ children }) {
  return (
    <div className="relative h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-between overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Ambient background glows tailored for light theme */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl" />

      {/* Subtle precision dot grid covering the entire screen */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.22]" />

      {/* Main Section: Left Hero Showcase & Right Auth Box (Centered Layout with padding) */}
      <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl mx-auto my-auto p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 xl:gap-14">
        {/* Left Hero Content */}
        <div className="w-full lg:max-w-lg xl:max-w-xl select-none">
          {/* Brand Name highlighted bigger with tight spacing to text below */}
          <div className="mb-2.5 sm:mb-3.5">
            <span className="font-display font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tight text-slate-900 block leading-none">
              Speech Engine
            </span>
          </div>

          <h1 className="hidden lg:block font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mt-2">
            Turn your written words into{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              natural speech.
            </span>
          </h1>

          <p className="hidden lg:block mt-2 sm:mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-lg">
            Convert scripts into hyper-realistic, expressive voiceovers with human cadence and multi-lingual neural accents.
          </p>

          {/* Minimal Audio Preview Card (Light theme) */}
          <div className="hidden lg:block mt-4 sm:mt-5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md max-w-md">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="font-medium text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Studio Voice Preview
              </span>
              <span className="font-mono text-[11px] text-slate-400">48 kHz · Lossless</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Mic className="w-4 h-4" />
              </div>

              {/* Minimal soundwave bars */}
              <div className="flex-1 flex items-end gap-1 h-6 px-1">
                {[35, 55, 25, 80, 100, 70, 40, 90, 60, 85, 45, 65, 95, 35, 75, 55, 80, 30, 90, 50, 25].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1 bg-brand-500/80 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-slate-500">0:18</span>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="hidden lg:grid mt-4 sm:mt-5 grid-cols-2 gap-2.5 text-xs text-slate-700 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>29+ Global accents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>Sub-second synthesis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>Studio audio exports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>Persistent history</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Box Slot */}
        <div className="w-full lg:w-[420px] flex justify-center lg:justify-end flex-shrink-0">
          {children}
        </div>
      </div>

      {/* Bottom Footer: Edge-to-Edge touching both ends entirely */}
      <footer className="relative z-10 w-full border-t border-slate-200/90 px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-between text-xs text-slate-500 bg-white/70 backdrop-blur-xs flex-shrink-0">
        <span>© 2026 Speech Engine</span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          All systems operational
        </span>
      </footer>
    </div>
  );
}
