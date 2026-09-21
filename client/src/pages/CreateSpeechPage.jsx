import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Hero from '../components/speech/Hero';
import TextEditor from '../components/speech/TextEditor';
import VoiceSettings, { LANGUAGES, VOICES } from '../components/speech/VoiceSettings';
import GenerateButton from '../components/speech/GenerateButton';
import AudioResult from '../components/speech/AudioResult';
import EmptyAudioState from '../components/speech/EmptyAudioState';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import { ttsService } from '../services/api';

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
  const [currentSpeechId, setCurrentSpeechId] = useState(null);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Track the current blob URL and component mount status for lifecycle management
  const audioUrlRef = useRef(null);
  const isMountedRef = useRef(true);

  // Safely revoke active blob URL and clear ref
  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch (err) {
        console.warn('[CreateSpeechPage] Error revoking audio object URL:', err);
      }
      audioUrlRef.current = null;
    }
  }, []);

  // Component unmount cleanup: ensures active blob URL is always revoked when navigating away
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (audioUrlRef.current) {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch (err) {
          console.warn('[CreateSpeechPage] Error revoking audio object URL on unmount:', err);
        }
        audioUrlRef.current = null;
      }
    };
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
    setCurrentSpeechId(null);

    // Start loading
    setIsLoading(true);
    setAudioState('loading');

    try {
      const { audioBlob, speechId } = await ttsService.generateSpeechAudio({
        text: text.trim(),
        language: selectedLanguage,
        voice: selectedVoice,
      });

      // Guard: do not allocate object URL or update state if unmounted while request was in-flight
      if (!isMountedRef.current) {
        return;
      }

      // Revoke the previous object URL right before replacing with the newly generated audio URL
      revokeAudioUrl();

      // Create object URL for the audio blob
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setCurrentSpeechId(speechId || null);
      setAudioState('generated');
      setToastMessage('Speech generated successfully.');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      if (!isMountedRef.current) return;
      // Revoke any previous audio URL and reset audio state on generation error
      revokeAudioUrl();
      setAudioUrl(null);
      setGenerationError(err.message || 'Speech generation failed. Please try again.');
      setAudioState('empty');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [text, selectedLanguage, selectedVoice, revokeAudioUrl]);

  // Toggle favorite for current generated speech and synchronize with backend
  const handleToggleFavorite = useCallback(async (nextState) => {
    if (!currentSpeechId) {
      setToastMessage('Cannot update favorite: speech record ID is missing.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    const willFavorite = typeof nextState === 'boolean' ? nextState : !isFavorite;

    try {
      if (willFavorite) {
        await ttsService.favoriteSpeech(currentSpeechId);
      } else {
        await ttsService.unfavoriteSpeech(currentSpeechId);
      }

      setIsFavorite(willFavorite);
      setToastMessage(willFavorite ? 'Saved to Starred Favorites' : 'Removed from Starred Favorites');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('[CreateSpeechPage] Failed to toggle favorite:', err);
      // Preserve previous star state, show error toast
      setToastMessage(err?.message || 'Failed to update favorite status. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  }, [currentSpeechId, isFavorite]);

  // Button disabled condition: empty text, over limit, or currently generating
  const isButtonDisabled = text.trim().length === 0 || text.length > 5000 || isLoading;

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Hero Section */}
      <Hero />

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
                  setCurrentSpeechId(null);
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

