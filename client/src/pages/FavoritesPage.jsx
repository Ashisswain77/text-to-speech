import React, { useState, useEffect, useRef } from 'react';
import { Star, Play, Pause, Download, Trash2, Clock, Loader2 } from 'lucide-react';
import { getStoredFavorites, removeStoredFavorite, saveFavorites, mapItemToApiPayload } from '../services/historyStorage';
import { ttsService } from '../services/api';
import Toast from '../components/common/Toast';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(() => getStoredFavorites());
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const [toast, setToast] = useState(null);
  const audioRef = useRef(null);

  // Cleanup audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Audio Play / Pause handler
  const handlePlay = async (item) => {
    if (activeAudioId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveAudioId(null);
      return;
    }

    // Stop currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveAudioId(null);

    let audioSource = item.audioUrl || item.audioData;

    // If audio data isn't cached yet, fetch it from TTS API
    if (!audioSource) {
      setLoadingAudioId(item.id);
      try {
        const payload = mapItemToApiPayload(item);
        const blob = await ttsService.generateSpeechAudio(payload);
        const url = URL.createObjectURL(blob);
        audioSource = url;

        // Persist generated URL to current list and storage
        const updated = favorites.map((f) => (f.id === item.id ? { ...f, audioUrl: url } : f));
        setFavorites(updated);
        saveFavorites(updated);
      } catch (err) {
        setLoadingAudioId(null);
        setToast({
          message: `Audio not available: ${err.message || 'Failed to retrieve audio'}`,
          type: 'error',
        });
        return;
      } finally {
        setLoadingAudioId(null);
      }
    }

    try {
      const audio = new Audio(audioSource);
      audioRef.current = audio;

      audio.onended = () => {
        setActiveAudioId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setActiveAudioId(null);
        audioRef.current = null;
        setToast({
          message: 'Playback error: Audio file could not be played.',
          type: 'error',
        });
      };

      await audio.play();
      setActiveAudioId(item.id);
    } catch (err) {
      setActiveAudioId(null);
      audioRef.current = null;
      setToast({
        message: `Playback failed: ${err.message || 'Unable to play audio.'}`,
        type: 'error',
      });
    }
  };

  // Download audio handler
  const handleDownload = async (item) => {
    let audioSource = item.audioUrl || item.audioData;

    if (!audioSource) {
      try {
        setToast({ message: 'Fetching audio for download...', type: 'success' });
        const payload = mapItemToApiPayload(item);
        const blob = await ttsService.generateSpeechAudio(payload);
        const url = URL.createObjectURL(blob);
        audioSource = url;
      } catch (err) {
        setToast({
          message: `Download failed: ${err.message || 'Unable to fetch audio'}`,
          type: 'error',
        });
        return;
      }
    }

    try {
      const filename = `speechengine-${item.id}.mp3`;
      const a = document.createElement('a');
      a.href = audioSource;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToast({ message: `Downloaded ${filename}`, type: 'success' });
    } catch (err) {
      setToast({
        message: `Download failed: ${err.message || 'Unable to trigger download.'}`,
        type: 'error',
      });
    }
  };

  // Remove item from favorites and synchronize storage
  const handleRemove = (id) => {
    removeStoredFavorite(id);
    setFavorites((prev) => prev.filter((item) => item.id !== id));

    if (activeAudioId === id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setActiveAudioId(null);
    }

    setToast({ message: 'Removed from Starred Favorites', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            <span>Starred Favorites</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quick access to your highest rated and pinned speech generations.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800/60">
          {favorites.length} Saved Items
        </span>
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((item) => {
            const isPlaying = activeAudioId === item.id;
            const isLoadingThisAudio = loadingAudioId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      title="Remove from favorites"
                      className="text-amber-500 hover:text-slate-400 dark:hover:text-slate-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Star className="w-4.5 h-4.5 fill-amber-400" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-3">
                    "{item.text}"
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {item.language}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium border border-brand-100 dark:border-brand-800/60">
                      {item.voice}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlay(item)}
                    disabled={isLoadingThisAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingThisAudio ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    )}
                    <span>{isLoadingThisAudio ? 'Loading...' : isPlaying ? 'Pause' : 'Play Audio'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      aria-label="Download audio"
                      title="Download audio"
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Delete favorite"
                      title="Delete from favorites"
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No favorite audio clips saved</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Star audio results from the Create Speech workspace or History to access them quickly here.
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type || 'success'}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

