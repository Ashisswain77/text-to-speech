import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  addHistoryItem,
  updateHistoryItem,
  getStoredFavorites,
  saveFavorites,
  removeStoredFavorite,
} from '../services/historyStorage';

// Flag to easily toggle off dev inspector before production
const ENABLE_DEV_INSPECTOR = true;

const SAMPLE_TEXT = "Vocalis converts your written ideas into natural-sounding speech with studio clarity. Choose from multi-lingual neural voices with expressive cadence and natural clarity.";

const NEAR_LIMIT_TEXT = "Vocalis converts your written ideas into natural-sounding speech with studio clarity. ".repeat(53) + "Final sentence approaching five thousand characters.";

const OVER_LIMIT_TEXT = "This text intentionally exceeds the maximum limit for demonstration purposes. ".repeat(66);

export default function CreateSpeechPage() {
  // 1. Initial Default State: Strictly Clean & Empty
  const [text, setText] = useState(''); // Empty initial state as requested
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('sarah');

  // Dynamic voice catalog from backend API
  const [languages, setLanguages] = useState([]);
  const [voices, setVoices] = useState([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [voiceError, setVoiceError] = useState(null);

  // 2. Output & Loading States
  const [audioState, setAudioState] = useState('empty'); // 'empty' | 'generated' | 'loading'
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Speech generated successfully.');
  const [toastType, setToastType] = useState('success');
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentGeneratedItem, setCurrentGeneratedItem] = useState(null);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Track the current blob URL so we can revoke it on new generation or unmount
  const audioUrlRef = useRef(null);

  // Revoke old blob URL when replacing with newly generated audio
  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);


  // Ensure selectedVoice is always valid for selectedLanguage.
  // This is the authoritative guard — catches dropdown changes, async loads, retries, and dev inspector.
  useEffect(() => {
    if (voices.length === 0) return; // No catalog yet — skip until voices load

    const availableForLang = voices.filter(
      (v) => v.language === selectedLanguage || (Array.isArray(v.supportedLanguages) && v.supportedLanguages.includes(selectedLanguage))
    );

    if (availableForLang.length === 0) return; // Defensive — no voices for this language

    const isCurrentVoiceValid = availableForLang.some((v) => v.id === selectedVoice);
    if (!isCurrentVoiceValid) {
      setSelectedVoice(availableForLang[0].id);
    }
  }, [selectedLanguage, voices, selectedVoice]);

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

  // Selected Voice & Language metadata
  const effectiveVoices = useMemo(() => voices.length > 0 ? voices : (VOICES[selectedLanguage] || VOICES['en-US']), [voices, selectedLanguage]);
  const effectiveLanguages = useMemo(() => languages.length > 0 ? languages : LANGUAGES, [languages]);
  const currentVoiceObj = useMemo(
    () => effectiveVoices.find((v) => v.id === selectedVoice) || effectiveVoices[0] || { name: 'Sarah', gender: 'Female' },
    [effectiveVoices, selectedVoice]
  );
  const currentLangObj = useMemo(
    () => effectiveLanguages.find((l) => l.id === selectedLanguage) || effectiveLanguages[0] || { name: 'English (US)' },
    [effectiveLanguages, selectedLanguage]
  );

  // Generate Button — real TTS synthesis (Day 11)
  const handleGenerateClick = useCallback(async () => {
    // Client-side validation
    if (!text.trim()) {
      setErrorType('empty_text');
      return;
    }
    if (text.length > 5000) {
      setErrorType('limit_exceeded');
      return;
    }
    setErrorType(null);
    setGenerationError(null);

    // Reset favorite state for newly generated clip
    setIsFavorite(false);
    setCurrentGeneratedItem(null);

    // Start loading
    setIsLoading(true);
    setAudioState('loading');

    // Revoke previous blob URL
    revokeAudioUrl();
    setAudioUrl(null);

    try {
      const audioBlob = await ttsService.generateSpeechAudio({
        text: text.trim(),
        language: selectedLanguage,
        voice: selectedVoice,
      });

      // Create object URL for the audio blob
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setAudioState('generated');
      setToastMessage('Speech generated successfully.');
      setToastType('success');
      setShowToast(true);

      const generatedId = `hist-${Date.now()}`;
      const itemObj = {
        id: generatedId,
        title: text.trim().slice(0, 35) + (text.trim().length > 35 ? '...' : ''),
        text: text.trim(),
        language: currentLangObj.name || selectedLanguage,
        langCode: selectedLanguage,
        voice: `${currentVoiceObj.name} (${currentVoiceObj.gender || 'Neural'})`,
        voiceId: selectedVoice,
        duration: "00:05",
        createdDate: "Today, Just now",
        addedDate: "Today, Just now",
        isFavorite: false,
        audioUrl: url,
      };

      setCurrentGeneratedItem(itemObj);
      addHistoryItem(itemObj);

      // Save base64 audio data asynchronously so it persists across refreshes
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            updateHistoryItem(generatedId, { audioData: reader.result });
            setCurrentGeneratedItem((prev) =>
              prev && prev.id === generatedId ? { ...prev, audioData: reader.result } : prev
            );
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (historyErr) {
        console.warn('Failed saving generated audio data to history:', historyErr);
      }
    } catch (err) {
      setGenerationError(err.message || 'Speech generation failed. Please try again.');
      setAudioState('empty');
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedLanguage, selectedVoice, revokeAudioUrl, currentLangObj, currentVoiceObj]);

  // Toggle favorite for current generated speech and synchronize with Favorites page
  const handleToggleFavorite = useCallback((nextState) => {
    const next = typeof nextState === 'boolean' ? nextState : !isFavorite;
    setIsFavorite(next);

    const activeItem = currentGeneratedItem || {
      id: `hist-${Date.now()}`,
      title: text.trim().slice(0, 35) + (text.trim().length > 35 ? '...' : ''),
      text: text.trim() || SAMPLE_TEXT,
      language: currentLangObj.name || selectedLanguage,
      voice: `${currentVoiceObj.name} (${currentVoiceObj.gender || 'Neural'})`,
      duration: "00:05",
      addedDate: "Today, Just now",
      createdDate: "Today, Just now",
      audioUrl: audioUrl,
      isFavorite: next,
    };

    if (!currentGeneratedItem) {
      setCurrentGeneratedItem(activeItem);
      addHistoryItem(activeItem);
    } else {
      updateHistoryItem(activeItem.id, { isFavorite: next });
      setCurrentGeneratedItem((prev) => (prev ? { ...prev, isFavorite: next } : prev));
    }

    const currentFavorites = getStoredFavorites();
    if (next) {
      const favEntry = {
        id: activeItem.id,
        title: activeItem.title || text.trim().slice(0, 35) + (text.trim().length > 35 ? '...' : ''),
        text: activeItem.text || text.trim(),
        language: activeItem.language || currentLangObj.name,
        voice: activeItem.voice || `${currentVoiceObj.name} (${currentVoiceObj.gender || 'Neural'})`,
        duration: activeItem.duration || "00:05",
        addedDate: "Today, Just now",
        audioUrl: activeItem.audioUrl || audioUrl,
        audioData: activeItem.audioData,
      };
      saveFavorites([favEntry, ...currentFavorites.filter((f) => f.id !== activeItem.id)]);
      setToastMessage("Saved to Starred Favorites");
    } else {
      removeStoredFavorite(activeItem.id);
      setToastMessage("Removed from Starred Favorites");
    }
    setToastType("success");
    setShowToast(true);
  }, [isFavorite, currentGeneratedItem, text, currentLangObj, selectedLanguage, currentVoiceObj, audioUrl]);

  // Button disabled condition: empty text, over limit, or currently generating
  const isButtonDisabled = text.trim().length === 0 || text.length > 5000 || isLoading;

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Development Only Floating State Inspector */}
      {ENABLE_DEV_INSPECTOR && (
        <StateControllerToolbar
          onSetEditorState={handleSetEditorState}
          onToggleLoading={() => setIsLoading(!isLoading)}
          isLoading={isLoading}
          onSetAudioState={(state) => {
            setAudioState(state);
            if (state === 'empty') {
              revokeAudioUrl();
              setAudioUrl(null);
              setIsFavorite(false);
              setCurrentGeneratedItem(null);
            }
          }}
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

      {/* Generation Error Banner */}
      {generationError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-800 dark:text-rose-300">
          <span className="flex-shrink-0 text-base">⚠️</span>
          <span>{generationError}</span>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
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

        {/* Step 4: Audio Result Section */}
        <section aria-labelledby="output-title" className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 id="output-title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>3. Generated Audio</span>
            </h2>
            {audioState === 'generated' && (
              <button
                type="button"
                onClick={() => {
                  setAudioState('empty');
                  revokeAudioUrl();
                  setAudioUrl(null);
                  setIsFavorite(false);
                  setCurrentGeneratedItem(null);
                }}
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
              audioUrl={audioUrl}
              isLoading={false}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {audioState === 'loading' && (
            <AudioResult
              isLoading={true}
            />
          )}
        </section>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

