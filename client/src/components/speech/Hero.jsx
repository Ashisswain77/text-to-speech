import React, { useState } from 'react';
import { Play, Pause, Volume2, Wand2, BookOpen, Mic, Rocket, HeartHandshake } from 'lucide-react';

const SAMPLE_PROMPTS = [
  {
    id: 'podcast',
    label: 'Podcast Intro',
    icon: Mic,
    text: "Welcome back to Tech Horizons, the podcast where we break down the most impactful breakthroughs in artificial intelligence, neural audio, and creative technology.",
  },
  {
    id: 'story',
    label: 'Story Narration',
    icon: BookOpen,
    text: "Beyond the misty ridges of the northern valley, an ancient observatory stood under a canopy of violet stars, untouched by the passage of three centuries.",
  },
  {
    id: 'product',
    label: 'Product Launch',
    icon: Rocket,
    text: "Introducing SpeechEngine Studio 2.0. Generate ultra-realistic, multi-accent voiceovers in seconds with granular emotional cadence and studio-grade clarity.",
  },
  {
    id: 'meditation',
    label: 'Calm Meditation',
    icon: HeartHandshake,
    text: "Take a deep, slow breath in through your nose. Pause for a moment, let go of any tension in your shoulders, and gently exhale.",
  },
];

export default function Hero({ onInsertSample }) {
  const [isVisualizerActive, setIsVisualizerActive] = useState(true);
  const [activePromptId, setActivePromptId] = useState(null);

  const handleSelectPrompt = (prompt) => {
    setActivePromptId(prompt.id);
    if (onInsertSample) {
      onInsertSample(prompt.text);
    }
  };

  // 14 visualizer bars with staggered animation delays
  const visualizerBars = [
    { height: '40%', delay: '0s' },
    { height: '75%', delay: '0.15s' },
    { height: '95%', delay: '0.3s' },
    { height: '60%', delay: '0.45s' },
    { height: '85%', delay: '0.2s' },
    { height: '50%', delay: '0.5s' },
    { height: '100%', delay: '0.1s' },
    { height: '65%', delay: '0.35s' },
    { height: '90%', delay: '0.25s' },
    { height: '45%', delay: '0.4s' },
    { height: '80%', delay: '0.05s' },
    { height: '55%', delay: '0.3s' },
    { height: '70%', delay: '0.15s' },
    { height: '35%', delay: '0.5s' },
  ];

  return (
    <div className="relative mb-8 md:mb-10 pt-1">
      {/* Subtle ambient decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-16 -left-12 w-72 h-72 rounded-full bg-brand-400/10 dark:bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-12 -right-12 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
        {/* Left: Heading & Description */}
        <div className="max-w-2xl">
          {/* Heading with Outfit display font and gradient accent */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Turn your written words into{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
              natural speech.
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Convert scripts into hyper-realistic, expressive voiceovers with fine-tuned pitch, cadence, and multi-lingual neural accents.
          </p>
        </div>

        {/* Right: Interactive Audio Visualizer Box (Togglable) */}
        <div className="flex-shrink-0 flex flex-col items-start lg:items-end gap-2">
          <div className="w-full sm:w-auto flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/80 shadow-xs">
            {/* Visualizer bars */}
            <div className="flex items-end gap-1.5 h-9 px-1">
              {visualizerBars.map((bar, idx) => (
                <div
                  key={idx}
                  style={{
                    height: isVisualizerActive ? bar.height : '20%',
                    animationDelay: bar.delay,
                  }}
                  className={`
                    w-1.5 rounded-full transition-all duration-300
                    ${isVisualizerActive 
                      ? 'bg-gradient-to-t from-brand-600 to-indigo-400 dark:from-brand-500 dark:to-indigo-300 animate-soundwave' 
                      : 'bg-slate-300 dark:bg-slate-700'
                    }
                  `}
                />
              ))}
            </div>

            {/* Toggle visualizer button */}
            <button
              type="button"
              onClick={() => setIsVisualizerActive((prev) => !prev)}
              aria-label={isVisualizerActive ? "Pause interactive soundwaves" : "Play interactive soundwaves"}
              title={isVisualizerActive ? "Pause soundwaves animation" : "Resume soundwaves animation"}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500
                ${isVisualizerActive
                  ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
            >
              {isVisualizerActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Wave</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Wave</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium px-1">
            <Volume2 className="w-3 h-3 text-brand-500" />
            <span>Interactive real-time audio monitor</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Interactive Inspiration Chips (Seamlessly integrated) */}
      <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mr-1">
          <Wand2 className="w-3.5 h-3.5 text-brand-500" />
          <span>Quick Prompts:</span>
        </span>

        {SAMPLE_PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          const isActive = activePromptId === prompt.id;

          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handleSelectPrompt(prompt)}
              className={`
                group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95
                ${isActive
                  ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-slate-700 hover:bg-brand-50/50 dark:hover:bg-slate-800 shadow-xs'
                }
              `}
            >
              <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'}`} />
              <span>{prompt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
