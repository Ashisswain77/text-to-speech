import React, { useState } from 'react';
import Hero from '../components/speech/Hero';
import TextEditor from '../components/speech/TextEditor';
import VoiceSettings, { LANGUAGES, VOICES } from '../components/speech/VoiceSettings';
import GenerateButton from '../components/speech/GenerateButton';
import AudioResult from '../components/speech/AudioResult';
import EmptyAudioState from '../components/speech/EmptyAudioState';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import StateControllerToolbar from '../components/common/StateControllerToolbar';

const SAMPLE_TEXT = "Vocalis converts your written ideas into natural-sounding speech with studio clarity. Choose from multi-lingual neural voices with fine-tuned pitch, cadence, and expression.";

const NEAR_LIMIT_TEXT = "Vocalis converts your written ideas into natural-sounding speech with studio clarity. ".repeat(53) + "Final sentence approaching five thousand characters.";

const OVER_LIMIT_TEXT = "This text intentionally exceeds the maximum limit for demonstration purposes. ".repeat(66);

export default function CreateSpeechPage() {
  // State for Day 2 Presentation
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('sarah');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(100);

  // Visual state controls
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudioResult, setHasAudioResult] = useState(true);
  const [errorType, setErrorType] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Inspector state switcher
  const handleSetEditorState = (stateName) => {
    if (stateName === 'empty') {
      setText('');
      setErrorType(null);
    } else if (stateName === 'entered') {
      setText(SAMPLE_TEXT);
      setErrorType(null);
    } else if (stateName === 'near_limit') {
      setText(NEAR_LIMIT_TEXT);
      setErrorType(null);
    } else if (stateName === 'over_limit') {
      setText(OVER_LIMIT_TEXT);
      setErrorType('limit_exceeded');
    }
  };

  // Trigger simulated generate state
  const handleGenerate = () => {
    if (text.trim().length === 0) {
      setErrorType('empty_text');
      return;
    }
    if (text.length > 5000) {
      setErrorType('limit_exceeded');
      return;
    }

    setErrorType(null);
    setIsLoading(true);

    // Simulate short presentation transition (no real API)
    setTimeout(() => {
      setIsLoading(false);
      setHasAudioResult(true);
      setShowToast(true);
    }, 1200);
  };

  // Find voice metadata
  const currentVoiceObj = (VOICES[selectedLanguage] || VOICES['en-US']).find((v) => v.id === selectedVoice) || { name: 'Sarah' };
  const currentLangObj = LANGUAGES.find((l) => l.id === selectedLanguage) || { name: 'English (US)' };

  return (
    <div className="space-y-6">
      {/* Day 2 UI State Inspector Bar */}
      <StateControllerToolbar
        onSetEditorState={handleSetEditorState}
        onToggleLoading={() => setIsLoading(!isLoading)}
        isLoading={isLoading}
        onToggleAudioResult={() => setHasAudioResult(!hasAudioResult)}
        hasAudioResult={hasAudioResult}
        onSetErrorType={setErrorType}
        errorType={errorType}
        onTriggerToast={() => setShowToast(true)}
      />

      {/* Hero Section */}
      <Hero />

      {/* Reusable Error Banner if an error state is active */}
      {errorType && (
        <ErrorMessage
          type={errorType}
          onDismiss={() => setErrorType(null)}
        />
      )}

      {/* Main Workspace Layout */}
      <div className="space-y-6">
        {/* Step 1: Text Editor */}
        <section aria-labelledby="editor-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="editor-heading" className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <span>Input Text</span>
            </h2>
            <span className="text-xs text-slate-400">Max 5,000 characters per conversion</span>
          </div>

          <TextEditor
            text={text}
            onChange={(val) => {
              setText(val);
              if (errorType === 'empty_text' && val.trim().length > 0) {
                setErrorType(null);
              }
              if (val.length > 5000) {
                setErrorType('limit_exceeded');
              } else if (errorType === 'limit_exceeded') {
                setErrorType(null);
              }
            }}
            onClear={() => {
              setText('');
              setErrorType(null);
            }}
            isLoading={isLoading}
          />
        </section>

        {/* Step 2: Voice Configuration */}
        <section aria-labelledby="voice-heading" className="space-y-2">
          <h2 id="voice-heading" className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">2</span>
            <span>Voice & Language Configuration</span>
          </h2>

          <VoiceSettings
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            speed={speed}
            onSpeedChange={setSpeed}
            pitch={pitch}
            onPitchChange={setPitch}
            volume={volume}
            onVolumeChange={setVolume}
          />
        </section>

        {/* Step 3: Generate CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-card">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-sm font-bold text-slate-900">
              Ready to synthesize?
            </div>
            <p className="text-xs text-slate-500">
              Estimated duration: ~{Math.max(3, Math.round(text.length / 15))} seconds · High-fidelity MP3
            </p>
          </div>

          <GenerateButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={isLoading || text.length > 5000}
            charCount={text.length}
          />
        </div>

        {/* Step 4: Audio Result or Empty State */}
        <section aria-labelledby="result-heading" className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h2 id="result-heading" className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <span>Synthesized Speech Output</span>
            </h2>
            {hasAudioResult && (
              <span className="text-xs text-brand-600 font-medium cursor-pointer hover:underline" onClick={() => setHasAudioResult(false)}>
                Clear Output
              </span>
            )}
          </div>

          {hasAudioResult ? (
            <AudioResult
              language={currentLangObj.name}
              voice={currentVoiceObj.name}
              duration="01:24"
              textSnippet={text ? text.slice(0, 95) + (text.length > 95 ? '...' : '') : "No script provided"}
              onDownload={() => setShowToast(true)}
            />
          ) : (
            <EmptyAudioState />
          )}
        </section>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="Speech generated successfully."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
