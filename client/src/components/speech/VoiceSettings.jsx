import React, { useState } from 'react';
import { 
  Globe2, 
  Mic, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';

export const LANGUAGES = [
  { id: 'en-US', name: 'English (US)', flag: '🇺🇸', native: 'English' },
  { id: 'hi-IN', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
  { id: 'gu-IN', name: 'Gujarati', flag: '🇮🇳', native: 'ગુજરાતી' },
  { id: 'mr-IN', name: 'Marathi', flag: '🇮🇳', native: 'मराठी' },
  { id: 'es-ES', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { id: 'fr-FR', name: 'French', flag: '🇫🇷', native: 'Français' },
  { id: 'de-DE', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
];

export const VOICES = {
  'en-US': [
    { id: 'sarah', name: 'Sarah', gender: 'Female', accent: 'American', style: 'Conversational', tag: 'Neural' },
    { id: 'david', name: 'David', gender: 'Male', accent: 'American', style: 'Authoritative', tag: 'Studio' },
    { id: 'sonia', name: 'Sonia', gender: 'Female', accent: 'British', style: 'Expressive', tag: 'Neural' },
    { id: 'marcus', name: 'Marcus', gender: 'Male', accent: 'Australian', style: 'Warm & Deep', tag: 'Studio' },
  ],
  'hi-IN': [
    { id: 'priya', name: 'Priya', gender: 'Female', accent: 'Indian', style: 'Natural', tag: 'Neural' },
    { id: 'aarav', name: 'Aarav', gender: 'Male', accent: 'Indian', style: 'Warm', tag: 'Studio' },
  ],
  'gu-IN': [
    { id: 'diya', name: 'Diya', gender: 'Female', accent: 'Gujarati', style: 'Natural', tag: 'Neural' },
    { id: 'karan', name: 'Karan', gender: 'Male', accent: 'Gujarati', style: 'Clear', tag: 'Studio' },
  ],
  'mr-IN': [
    { id: 'ananya', name: 'Ananya', gender: 'Female', accent: 'Marathi', style: 'Natural', tag: 'Neural' },
    { id: 'rohan', name: 'Rohan', gender: 'Male', accent: 'Marathi', style: 'Expressive', tag: 'Studio' },
  ],
  'es-ES': [
    { id: 'elena', name: 'Elena', gender: 'Female', accent: 'Castilian', style: 'Conversational', tag: 'Neural' },
    { id: 'carlos', name: 'Carlos', gender: 'Male', accent: 'Castilian', style: 'Clear', tag: 'Studio' },
  ],
  'fr-FR': [
    { id: 'chloe', name: 'Chloé', gender: 'Female', accent: 'Parisian', style: 'Warm & Soft', tag: 'Neural' },
    { id: 'lucas', name: 'Lucas', gender: 'Male', accent: 'Parisian', style: 'Narrative', tag: 'Studio' },
  ],
  'de-DE': [
    { id: 'hannah', name: 'Hannah', gender: 'Female', accent: 'Standard', style: 'Crisp', tag: 'Neural' },
    { id: 'felix', name: 'Felix', gender: 'Male', accent: 'Standard', style: 'Professional', tag: 'Studio' },
  ],
};

export default function VoiceSettings({
  selectedLanguage = 'en-US',
  onSelectLanguage,
  selectedVoice = 'sarah',
  onSelectVoice,
  speed = 1.0,
  onSpeedChange,
  pitch = 0,
  onPitchChange,
  volume = 100,
  onVolumeChange,
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const currentVoices = VOICES[selectedLanguage] || VOICES['en-US'];
  const activeVoiceObj = currentVoices.find((v) => v.id === selectedVoice) || currentVoices[0];

  return (
    <div className="space-y-4">
      {/* Primary 2-Column Voice & Language Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="language-select" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Globe2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Language</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">7 supported</span>
          </div>

          <div className="relative">
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => {
                const newLang = e.target.value;
                if (onSelectLanguage) onSelectLanguage(newLang);
                const firstVoice = (VOICES[newLang] || [])[0];
                if (firstVoice && onSelectVoice) {
                  onSelectVoice(firstVoice.id);
                }
              }}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {lang.flag} {lang.name} — {lang.native}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Selected: {LANGUAGES.find((l) => l.id === selectedLanguage)?.name || 'English (US)'}
          </p>
        </div>

        {/* Voice Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="voice-select" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Mic className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Voice</span>
            </label>
            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
              {currentVoices.length} available
            </span>
          </div>

          <div className="relative">
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => onSelectVoice && onSelectVoice(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
            >
              {currentVoices.map((voice) => (
                <option key={voice.id} value={voice.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {voice.name} — {voice.gender} ({voice.accent})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Voice Metadata Badges */}
          {activeVoiceObj && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {activeVoiceObj.gender}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {activeVoiceObj.accent} Accent
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-brand-700 dark:text-brand-300 font-medium border border-indigo-100 dark:border-indigo-900/60">
                {activeVoiceObj.style}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Voice Customization (Collapsible) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          aria-expanded={isAdvancedOpen}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span>Advanced Voice Customization</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
              (Speed, Pitch, Volume)
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <span>{isAdvancedOpen ? 'Hide' : 'Expand'}</span>
            {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {isAdvancedOpen && (
          <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Speaking Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Speaking Speed</span>
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-800/60">
                  {speed.toFixed(1)}x
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <span>Slow</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => onSpeedChange && onSpeedChange(parseFloat(e.target.value))}
                  aria-label="Speaking speed"
                  className="flex-1"
                />
                <span>Fast</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pitch</span>
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-800/60">
                  {pitch > 0 ? `+${pitch}` : pitch} semitones
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <span>Low</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={pitch}
                  onChange={(e) => onPitchChange && onPitchChange(parseInt(e.target.value, 10))}
                  aria-label="Voice pitch"
                  className="flex-1"
                />
                <span>High</span>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Volume</span>
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-800/60">
                  {volume}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <span>Low</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => onVolumeChange && onVolumeChange(parseInt(e.target.value, 10))}
                  aria-label="Output volume"
                  className="flex-1"
                />
                <span>High</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
