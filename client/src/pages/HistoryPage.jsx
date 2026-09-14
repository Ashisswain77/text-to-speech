import React, { useState, useEffect, useRef } from 'react';
import { Search, History, AlertTriangle } from 'lucide-react';
import HistoryItem from '../components/history/HistoryItem';
import { HistoryItemSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { ttsService } from '../services/api';
import {
  getStoredHistory,
  deleteStoredHistoryItem,
  toggleStoredFavorite,
  updateHistoryItem,
  mapItemToApiPayload,
} from '../services/historyStorage';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [selectedVoice, setSelectedVoice] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [items, setItems] = useState(() => getStoredHistory());
  const [isLoading, setIsLoading] = useState(false);

  // Audio Playback State (Only 1 plays at a time)
  const [playingItemId, setPlayingItemId] = useState(null);
  const [loadingAudioItemId, setLoadingAudioItemId] = useState(null);
  const audioRef = useRef(null);

  // Delete confirmation & Toast state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Stop audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Close delete modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && itemToDelete) {
        setItemToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemToDelete]);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Play / Pause handler
  const handlePlay = async (item) => {
    // If clicking on the currently playing item -> pause it
    if (playingItemId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingItemId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingItemId(null);

    let audioSource = item.audioUrl || item.audioData;

    // If no existing audio source, try fetching real audio from backend API
    if (!audioSource) {
      setLoadingAudioItemId(item.id);
      try {
        const payload = mapItemToApiPayload(item);
        const blob = await ttsService.generateSpeechAudio(payload);
        const url = URL.createObjectURL(blob);
        audioSource = url;

        // Persist audioUrl to memory & local storage for future plays
        updateHistoryItem(item.id, { audioUrl: url });
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, audioUrl: url } : it))
        );

        // Convert to data URI asynchronously for persistent storage
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            updateHistoryItem(item.id, { audioData: reader.result });
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setLoadingAudioItemId(null);
        setToast({
          message: `Audio not available: ${err.message || 'Unable to retrieve audio.'}`,
          type: 'error',
        });
        return;
      } finally {
        setLoadingAudioItemId(null);
      }
    }

    // Play the audio
    try {
      const audio = new Audio(audioSource);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingItemId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingItemId(null);
        audioRef.current = null;
        setToast({
          message: 'Playback error: Audio file could not be played.',
          type: 'error',
        });
      };

      await audio.play();
      setPlayingItemId(item.id);
    } catch (err) {
      setPlayingItemId(null);
      audioRef.current = null;
      setToast({
        message: `Playback failed: ${err.message || 'Unable to play audio.'}`,
        type: 'error',
      });
    }
  };

  // Download handler
  const handleDownload = async (item) => {
    let audioSource = item.audioUrl || item.audioData;

    if (!audioSource) {
      try {
        setToast({ message: 'Fetching audio for download...', type: 'success' });
        const payload = mapItemToApiPayload(item);
        const blob = await ttsService.generateSpeechAudio(payload);
        const url = URL.createObjectURL(blob);
        audioSource = url;
        updateHistoryItem(item.id, { audioUrl: url });
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, audioUrl: url } : it))
        );
      } catch (err) {
        setToast({
          message: `Download failed: Audio file not available (${err.message || 'missing audio'})`,
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

  // Toggle favorite handler
  const handleToggleFavorite = (id) => {
    const updated = toggleStoredFavorite(id);
    setItems(updated);
    const item = updated.find((it) => it.id === id);
    if (item) {
      setToast({
        message: item.isFavorite ? 'Saved to Starred Favorites' : 'Removed from Starred Favorites',
        type: 'success',
      });
    }
  };

  // Confirm delete handler
  const confirmDelete = () => {
    if (!itemToDelete) return;

    // Stop audio if deleting the currently playing item
    if (playingItemId === itemToDelete.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingItemId(null);
    }

    const updated = deleteStoredHistoryItem(itemToDelete.id);
    setItems(updated);
    setItemToDelete(null);
    setToast({
      message: 'Speech clip permanently deleted from history.',
      type: 'success',
    });
  };

  // Filter & Search logic
  const filteredItems = items
    .filter((it) => {
      const matchesSearch =
        it.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.title && it.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLang =
        selectedLang === 'all' ||
        it.language.toLowerCase().includes(selectedLang.toLowerCase());
      const matchesVoice =
        selectedVoice === 'all' ||
        it.voice.toLowerCase().includes(selectedVoice.toLowerCase());
      return matchesSearch && matchesLang && matchesVoice;
    })
    .sort((a, b) => {
      if (selectedSort === 'oldest') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (selectedSort === 'duration') {
        return (b.duration || '').localeCompare(a.duration || '');
      }
      // 'latest' default
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Speech History</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and manage all previously synthesized voice clips.
          </p>
        </div>

        {/* State Toggle for Evaluation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoading(!isLoading)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors"
          >
            {isLoading ? 'Show Loaded Items' : 'Preview Loading Skeletons'}
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by script keywords..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Filter: Language */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="flex-1 md:w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="french">French</option>
          </select>

          {/* Filter: Voice */}
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="flex-1 md:w-36 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">All Voices</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          {/* Filter: Date */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="hidden sm:block md:w-36 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* History Items List or Skeletons */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
          </>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              isPlaying={playingItemId === item.id}
              isLoadingAudio={loadingAudioItemId === item.id}
              onPlay={() => handlePlay(item)}
              onDownload={() => handleDownload(item)}
              onDelete={() => setItemToDelete(item)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          ))
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {items.length === 0 ? 'No speech history yet' : 'No matching audio records'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {items.length === 0
                ? 'Synthesize your first voiceover from the Create Speech studio.'
                : 'Try adjusting your search query or clear the active filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setItemToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-100 dark:border-rose-900/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Speech Clip?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This speech clip will be removed permanently from your history.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-5">
              "{itemToDelete.text}"
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                Delete Clip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status & Notification Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
