import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Sun, 
  Moon, 
  Globe2, 
  Mic, 
  Volume2, 
  Shield, 
  Check,
  Save
} from 'lucide-react';
import { LANGUAGES, VOICES } from '../components/speech/VoiceSettings';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [defaultLang, setDefaultLang] = useState('en-US');
  const [defaultVoice, setDefaultVoice] = useState('sarah');
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [sampleRate, setSampleRate] = useState('48000');
  const [themeMode, setThemeMode] = useState('light');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const sections = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'defaults', label: 'Voice & Language Defaults', icon: Globe2 },
    { id: 'audio', label: 'Audio Preferences', icon: Volume2 },
    { id: 'account', label: 'Account & Quota', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-brand-600" />
          <span>Studio Settings</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default synthesis parameters, appearance, and audio export settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Settings Navigation Tabs */}
        <div className="lg:col-span-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-card space-y-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left
                  ${isActive 
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section: Profile */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500">Manage your developer profile and contact details.</p>

                <div className="flex items-center gap-4 pt-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-bold text-xl flex items-center justify-center shadow-md">
                    AV
                  </div>
                  <div>
                    <button type="button" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700">
                      Change Avatar
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1">JPG, PNG or GIF up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      defaultValue="Alexander Vance"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      defaultValue="alex@vocalis.ai"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Appearance */}
            {activeSection === 'appearance' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Appearance & Theme</h2>
                <p className="text-xs text-slate-500">Customize the studio interface lighting mode.</p>

                <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      themeMode === 'light'
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto text-amber-500 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800">Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      themeMode === 'dark'
                        ? 'border-brand-600 bg-slate-900 text-white ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto text-indigo-400 mb-1.5" />
                    <span className="text-xs font-semibold">Dark Mode (Preview)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Section: Defaults */}
            {activeSection === 'defaults' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Default Synthesis Preferences</h2>
                <p className="text-xs text-slate-500">Select the voice and language pre-selected when launching the studio.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Language</label>
                    <select
                      value={defaultLang}
                      onChange={(e) => setDefaultLang(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Voice</label>
                    <select
                      value={defaultVoice}
                      onChange={(e) => setDefaultVoice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {(VOICES[defaultLang] || VOICES['en-US']).map((v) => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Audio Preferences */}
            {activeSection === 'audio' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Audio Export Configuration</h2>
                <p className="text-xs text-slate-500">Fine-tune master audio bitrate and file format outputs.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">File Format</label>
                    <select
                      value={audioFormat}
                      onChange={(e) => setAudioFormat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="mp3">MP3 (Universal, recommended)</option>
                      <option value="wav">WAV (Lossless 24-bit PCM)</option>
                      <option value="aac">AAC (Modern streaming)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sample Rate</label>
                    <select
                      value={sampleRate}
                      onChange={(e) => setSampleRate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="48000">48,000 Hz (Broadcast Quality)</option>
                      <option value="44100">44,100 Hz (CD Audio)</option>
                      <option value="24000">24,000 Hz (Low Bandwidth)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Account & Quota */}
            {activeSection === 'account' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Account & Plan Limits</h2>
                <p className="text-xs text-slate-500">Current tier usage and API token consumption.</p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 font-semibold">Active Plan</span>
                    <span className="text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 font-bold">
                      Intermediate Tier
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Monthly Quota</span>
                    <span>12,450 / 50,000 characters used (25%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full w-[25%]" />
                  </div>
                </div>
              </div>
            )}

            {/* Save Buttons Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {isSaved ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <Check className="w-4 h-4" />
                  Preferences updated successfully
                </span>
              ) : (
                <span className="text-xs text-slate-400">Settings will apply to future speech sessions.</span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
