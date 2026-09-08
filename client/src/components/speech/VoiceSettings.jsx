import React, { useState } from 'react';
import { 
  Globe2, 
  Mic, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Volume2,
  Gauge,
  Activity
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
    { id: 'sarah', name: 'Sarah', gender: 'Female', accent: 'American', style: 'Conversational', tag: 'Neural HD' },
    { id: 'david', name: 'David', gender: 'Male', accent: 'American', style: 'Authoritative', tag: 'Studio' },
    { id: 'sonia', name: 'Sonia', gender: 'Female', accent: 'British', style: 'Expressive', tag: 'Neural' },
    { id: 'marcus', name: 'Marcus', gender: 'Male', accent: 'Australian', style: 'Warm & Deep', tag: 'Studio HD' },
  ],
  'hi-IN': [
    { id: 'priya', name: 'Priya', gender: 'Female', accent: 'Indian', style: 'Natural', tag: 'Neural HD' },
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
    { id: 'elena', name: 'Elena', gender: 'Female', accent: 'Castilian', style: 'Conversational', tag: 'Neural HD' },
    { id: 'carlos', name: 'Carlos', gender: 'Male', accent: 'Castilian', style: 'Clear', tag: 'Studio' },
  ],
  'fr-FR': [
    { id: 'chloe', name: 'Chloé', gender: 'Female', accent: 'Parisian', style: 'Warm & Soft', tag: 'Neural' },
    { id: 'lucas', name: 'Lucas', gender: 'Male', accent: 'Parisian', style: 'Narrative', tag: 'Studio' },
  ],
  'de-DE': [
    { id: 'hannah', name: 'Hannah', gender: 'Female', accent: 'Standard', style: 'Crisp', tag: 'Neural HD' },
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

  // Available voices for current language
  const currentVoices = VOICES[selectedLanguage] || VOICES['en-US'];
  const activeVoiceObj = currentVoices.find((v) => v.id === selectedVoice) || currentVoices[0];

  return (
    <div className="space-y-4">
      {/* Primary Configuration Grid: Two-column desktop, stacked mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selector Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="language-select" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Globe2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Language</span>
            </label>
            <span className="text-[11px] text-slate-400">7 available</span>
          </div>

          <div className="relative">
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => {
                const newLang = e.target.value;
                onSelectLanguage && onSelectLanguage(newLang);
                // reset voice to first of this language
                const firstVoice = (VOICES[newLang] || [])[0];
                if (firstVoice && onSelectVoice) {
                  onSelectVoice(firstVoice.id);
                }
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.flag} {lang.name} — {lang.native}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick info tag */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Multi-accent neural synthesis enabled</span>
          </div>
        </div>

        {/* Voice Selector Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="voice-select" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Mic className="w-3.5 h-3.5 text-brand-600" />
              <span>Voice</span>
            </label>
            <span className="text-[11px] text-brand-600 font-medium">
              {currentVoices.length} voices
            </span>
          </div>

          <div className="relative">
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => onSelectVoice && onSelectVoice(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
            >
              {currentVoices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} — {voice.gender} ({voice.accent})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active Voice Metadata Pill Badges */}
          {activeVoiceObj && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                {activeVoiceObj.gender}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                {activeVoiceObj.accent} Accent
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-brand-700 font-medium border border-indigo-100/80">
                {activeVoiceObj.style}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-brand-600 text-white font-semibold text-[10px]">
                {activeVoiceObj.tag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Voice Settings (Visually Secondary Accordion) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          aria-expanded={isAdvancedOpen}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors focus:outline-none focus:bg-slate-50"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Advanced Voice Customization</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              Intermediate
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{isAdvancedOpen ? 'Hide' : 'Show sliders'}</span>
            {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isAdvancedOpen && (
          <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 sm:grid-cols-3 gap-5 animate-in fade-in duration-150">
            {/* Speaking Speed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="speed-slider" className="font-medium text-slate-600 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span>Speed</span>
                </label>
                <span className="font-semibold text-brand-600">{speed.toFixed(1)}x</span>
              </div>
              <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => onSpeedChange && onSpeedChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="pitch-slider" className="font-medium text-slate-600 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pitch</span>
                </label>
                <span className="font-semibold text-brand-600">
                  {pitch > 0 ? `+${pitch}` : pitch} semitones
                </span>
              </div>
              <input
                id="pitch-slider"
                type="range"
                min="-10"
                max="10"
                step="1"
                value={pitch}
                onChange={(e) => onPitchChange && onPitchChange(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-10 (Deep)</span>
                <span>0 (Default)</span>
                <span>+10 (High)</span>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="volume-slider" className="font-medium text-slate-600 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Volume</span>
                </label>
                <span className="font-semibold text-brand-600">{volume}%</span>
              </div>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                onChange={(e) => onVolumeChange && onVolumeChange(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
