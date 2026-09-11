import React from 'react';
import { 
  Globe2, 
  Mic, 
  ChevronDown, 
  Loader2,
  AlertCircle,
  RefreshCw
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
  languages: dynamicLanguages = null,
  voices: dynamicVoices = null,
  isLoadingVoices = false,
  voiceError = null,
  onRetryVoices = null,
  selectedLanguage = 'en-US',
  onSelectLanguage,
  selectedVoice = 'sarah',
  onSelectVoice,
}) {

  // Use dynamic languages if available, else static fallback
  const effectiveLanguages = (dynamicLanguages && dynamicLanguages.length > 0)
    ? dynamicLanguages
    : LANGUAGES;

  // Derive voices for the selected language
  let currentVoices = [];
  if (dynamicVoices && dynamicVoices.length > 0) {
    currentVoices = dynamicVoices.filter(
      (v) => v.language === selectedLanguage || (Array.isArray(v.supportedLanguages) && v.supportedLanguages.includes(selectedLanguage))
    );
    if (currentVoices.length === 0) {
      currentVoices = dynamicVoices.filter((v) => v.language === 'en-US') || dynamicVoices;
    }
  } else {
    currentVoices = VOICES[selectedLanguage] || VOICES['en-US'];
  }

  const activeVoiceObj = currentVoices.find((v) => v.id === selectedVoice) || currentVoices[0];
  const activeLangObj = effectiveLanguages.find((l) => l.id === selectedLanguage) || effectiveLanguages[0];

  return (
    <div className="space-y-4">
      {/* Error Banner with Retry */}
      {voiceError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Could not refresh voice catalog from provider ({voiceError}). Using cached catalog.</span>
          </div>
          {onRetryVoices && (
            <button
              onClick={onRetryVoices}
              type="button"
              className="flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 ml-2 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>
      )}

      {/* Primary 2-Column Voice & Language Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="language-select" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Globe2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Language</span>
            </label>
            <div className="flex items-center gap-1.5">
              {isLoadingVoices && <Loader2 className="w-3 h-3 text-brand-500 animate-spin" />}
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {effectiveLanguages.length} supported
              </span>
            </div>
          </div>

          <div className="relative">
            <select
              id="language-select"
              value={selectedLanguage}
              disabled={isLoadingVoices && effectiveLanguages.length === 0}
              onChange={(e) => {
                const newLang = e.target.value;
                if (onSelectLanguage) onSelectLanguage(newLang);

                let availableVoices = [];
                if (dynamicVoices && dynamicVoices.length > 0) {
                  availableVoices = dynamicVoices.filter(
                    (v) => v.language === newLang || (Array.isArray(v.supportedLanguages) && v.supportedLanguages.includes(newLang))
                  );
                } else {
                  availableVoices = VOICES[newLang] || [];
                }

                // Only reset voice if the current selection is not available for the new language
                const currentVoiceValid = availableVoices.some((v) => v.id === selectedVoice);
                if (!currentVoiceValid && availableVoices.length > 0 && onSelectVoice) {
                  onSelectVoice(availableVoices[0].id);
                }
              }}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
            >
              {effectiveLanguages.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {lang.flag} {lang.name} {lang.native && lang.native !== lang.name ? `— ${lang.native}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Selected: {activeLangObj?.name || 'English (US)'}
          </p>
        </div>

        {/* Voice Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="voice-select" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Mic className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Voice</span>
            </label>
            <div className="flex items-center gap-1.5">
              {isLoadingVoices && <Loader2 className="w-3 h-3 text-brand-500 animate-spin" />}
              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                {currentVoices.length} available
              </span>
            </div>
          </div>

          <div className="relative">
            <select
              id="voice-select"
              value={selectedVoice}
              disabled={isLoadingVoices && currentVoices.length === 0}
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
    </div>
  );
}
