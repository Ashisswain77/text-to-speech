import React, { useState, useEffect, useCallback } from 'react';
import Hero from '../components/speech/Hero';
import TextEditor from '../components/speech/TextEditor';
import VoiceSettings, { LANGUAGES, VOICES } from '../components/speech/VoiceSettings';
import GenerateButton from '../components/speech/GenerateButton';
import AudioResult from '../components/speech/AudioResult';
import EmptyAudioState from '../components/speech/EmptyAudioState';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import StateControllerToolbar from '../components/common/StateControllerToolbar';
import { ttsService } from '../services/api';

// Flag to easily toggle off dev inspector before production
const ENABLE_DEV_INSPECTOR = true;

const SAMPLE_TEXT = "Vocalis converts your written ideas into natural-sounding speech with studio clarity. Choose from multi-lingual neural voices with fine-tuned pitch, cadence, and expression.";

const NEAR_LIMIT_TEXT = "Vocalis converts your written ideas into natural-sounding speech with studio clarity. ".repeat(53) + "Final sentence approaching five thousand characters.";

const OVER_LIMIT_TEXT = "This text intentionally exceeds the maximum limit for demonstration purposes. ".repeat(66);

export default function CreateSpeechPage() {
  // 1. Initial Default State: Strictly Clean & Empty
  const [text, setText] = useState(''); // Empty initial state as requested
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('sarah');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(100);

  // Dynamic voice catalog from backend API
  const [languages, setLanguages] = useState([]);
  const [voices, setVoices] = useState([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [voiceError, setVoiceError] = useState(null);

  // 2. Output & Loading States: Starts with clean 'empty' audio state
  const [audioState, setAudioState] = useState('empty'); // 'empty' | 'generated' | 'loading'
  const [isLoading, setIsLoading] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Fetch dynamic voice catalog from backend GET /api/voices
  const fetchVoices = useCallback(async () => {
    setIsLoadingVoices(true);
    setVoiceError(null);
    try {
      const data = await ttsService.getVoices();
      const fetchedVoices = data?.voices || [];
      const fetchedLanguages = data?.languages || [];

      setVoices(fetchedVoices);
      setLanguages(fetchedLanguages);

      if (fetchedLanguages.length > 0) {
        setSelectedLanguage((prevLang) => {
          const exists = fetchedLanguages.some((l) => l.id === prevLang);
          const newLang = exists ? prevLang : fetchedLanguages[0].id;

          // Auto-select first voice for language
          const matchingVoices = fetchedVoices.filter(
            (v) => v.language === newLang || (Array.isArray(v.supportedLanguages) && v.supportedLanguages.includes(newLang))
          );
          if (matchingVoices.length > 0) {
            setSelectedVoice((prevVoice) => {
              const voiceExists = matchingVoices.some((v) => v.id === prevVoice);
              return voiceExists ? prevVoice : matchingVoices[0].id;
            });
          }
          return newLang;
        });
      }
    } catch (err) {
      setVoiceError(err.message || 'Failed to load voices from server');
    } finally {
      setIsLoadingVoices(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    ttsService.getVoices()
      .then((data) => {
        if (!active) return;
        const fetchedVoices = data?.voices || [];
        const fetchedLanguages = data?.languages || [];
        setVoices(fetchedVoices);
        setLanguages(fetchedLanguages);

        if (fetchedLanguages.length > 0) {
          setSelectedLanguage((prevLang) => {
            const exists = fetchedLanguages.some((l) => l.id === prevLang);
            const newLang = exists ? prevLang : fetchedLanguages[0].id;

            const matchingVoices = fetchedVoices.filter(
              (v) => v.language === newLang || (Array.isArray(v.supportedLanguages) && v.supportedLanguages.includes(newLang))
            );
            if (matchingVoices.length > 0) {
              setSelectedVoice((prevVoice) => {
                const voiceExists = matchingVoices.some((v) => v.id === prevVoice);
                return voiceExists ? prevVoice : matchingVoices[0].id;
              });
            }
            return newLang;
          });
        }
      })
      .catch((err) => {
        if (active) setVoiceError(err.message || 'Failed to load voices from server');
      })
      .finally(() => {
        if (active) setIsLoadingVoices(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Dev Inspector Handlers (for Day 2 UI Review only)
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

  // Generate Button click behavior (UI-only validation for Day 2)
  const handleGenerateClick = () => {
    if (!text.trim()) {
      setErrorType('empty_text');
      return;
    }
    if (text.length > 5000) {
      setErrorType('limit_exceeded');
      return;
    }
    setErrorType(null);

    // Day 2 Presentation: Trigger preview state without fake backend execution
    setAudioState('generated');
  };

  // Selected Voice & Language metadata
  const effectiveVoices = voices.length > 0 ? voices : (VOICES[selectedLanguage] || VOICES['en-US']);
  const effectiveLanguages = languages.length > 0 ? languages : LANGUAGES;
  const currentVoiceObj = effectiveVoices.find((v) => v.id === selectedVoice) || effectiveVoices[0] || { name: 'Sarah', gender: 'Female' };
  const currentLangObj = effectiveLanguages.find((l) => l.id === selectedLanguage) || effectiveLanguages[0] || { name: 'English (US)' };

  // Button disabled condition: empty text or over limit
  const isButtonDisabled = text.trim().length === 0 || text.length > 5000;

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Development Only Floating State Inspector */}
      {ENABLE_DEV_INSPECTOR && (
        <StateControllerToolbar
          onSetEditorState={handleSetEditorState}
          onToggleLoading={() => setIsLoading(!isLoading)}
          isLoading={isLoading}
          onSetAudioState={setAudioState}
          audioState={audioState}
          onSetErrorType={setErrorType}
          errorType={errorType}
          onTriggerToast={() => setShowToast(true)}
          currentText={text}
          currentLanguage={selectedLanguage}
          currentVoice={selectedVoice}
        />
      )}

      {/* 2. Hero Section */}
      <Hero
        onInsertSample={(sample) => {
          setText(sample);
          if (errorType === 'empty_text' || errorType === 'limit_exceeded') {
            setErrorType(null);
          }
        }}
      />

      {/* 3. Error Banner if active */}
      {errorType && (
        <ErrorMessage
          type={errorType}
          onDismiss={() => setErrorType(null)}
        />
      )}

      {/* 4. Main Voice Studio Workspace */}
      <div className="space-y-6">
        {/* Step 1: Text Input Area */}
        <section aria-labelledby="editor-title" className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 id="editor-title" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>1. Text Input</span>
            </h2>
            <span className="text-xs text-slate-400">Max 5,000 characters</span>
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

        {/* Step 2: Voice & Language Configuration */}
        <section aria-labelledby="voice-title" className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 id="voice-title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>2. Voice & Language</span>
            </h2>
            <span className="text-xs text-slate-400">Neural voice models</span>
          </div>

          <VoiceSettings
            languages={languages}
            voices={voices}
            isLoadingVoices={isLoadingVoices}
            voiceError={voiceError}
            onRetryVoices={fetchVoices}
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

        {/* Step 3: Generate Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Synthesize Audio
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {text.trim()
                ? `Ready to generate ~${Math.max(1, Math.round(text.length / 15))}s audio clip in studio quality.`
                : 'Enter your text above to enable speech generation.'}
            </p>
          </div>

          <GenerateButton
            onClick={handleGenerateClick}
            isLoading={isLoading}
            disabled={isButtonDisabled}
          />
        </div>

        {/* Step 4: Audio Result Section (Clean Empty State by default) */}
        <section aria-labelledby="output-title" className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 id="output-title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>3. Generated Audio</span>
            </h2>
            {audioState === 'generated' && (
              <button
                type="button"
                onClick={() => setAudioState('empty')}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Reset to Empty State
              </button>
            )}
          </div>

          {/* Conditional rendering based on visual state */}
          {audioState === 'empty' && <EmptyAudioState />}

          {audioState === 'generated' && (
            <AudioResult
              language={currentLangObj.name}
              voice={currentVoiceObj.name}
              duration="01:24"
              textSnippet={text || "Your generated voiceover sample is ready for playback and export."}
              isLoading={false}
              onDownload={() => setShowToast(true)}
            />
          )}

          {audioState === 'loading' && (
            <AudioResult
              isLoading={true}
            />
          )}
        </section>
      </div>

      {/* Toast Notification (Manually triggerable via Dev Inspector only) */}
      {showToast && (
        <Toast
          message="Speech generated successfully."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
