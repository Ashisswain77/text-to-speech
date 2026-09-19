import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, History, AlertTriangle, RefreshCw } from 'lucide-react';
import HistoryItem from '../components/history/HistoryItem';
import { HistoryItemSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { ttsService, ApiError } from '../services/api';
import {
  getAudioSource,
  dataUriToBlob,
} from '../services/historyStorage';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [selectedVoice, setSelectedVoice] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Audio Playback State (Only 1 item plays at a time)
  const [playingItemId, setPlayingItemId] = useState(null);
  const [loadingAudioItemId, setLoadingAudioItemId] = useState(null);
  const audioRef = useRef(null);
  const currentAudioItemIdRef = useRef(null);
  const activeBlobUrlRef = useRef(null);

  // Delete confirmation & Toast state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch history from the authenticated API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await ttsService.getHistory();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error('[HistoryPage] Failed to fetch history:', err.message);
      if (err instanceof ApiError && err.status === 401) {
        setFetchError('Your session has expired. Please log in again.');
      } else if (err instanceof ApiError && err.isNetworkError) {
        setFetchError('Unable to connect to the server. Please check your network connection.');
      } else {
        setFetchError(err.message || 'Failed to load speech history.');
      }
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Helper to fully stop and reset current audio playback
  const stopAndResetCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.onplaying = null;
      audioRef.current.onpause = null;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setPlayingItemId(null);
    setLoadingAudioItemId(null);
    currentAudioItemIdRef.current = null;
  };

  // Stop audio on component unmount
  useEffect(() => {
    return () => {
      stopAndResetCurrentAudio();
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

  const handlePlaybackError = (itemId, err = null) => {
    if (currentAudioItemIdRef.current === itemId) {
      setLoadingAudioItemId(null);
      setPlayingItemId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      currentAudioItemIdRef.current = null;
      setToast({
        message: `Playback error: ${err?.message || 'Audio file could not be played or is unavailable.'}`,
        type: 'error',
      });
    }
  };

  // Play / Pause handler
  const handlePlay = async (item) => {
    // 1. If clicking on the currently playing item -> pause it
    if (playingItemId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingItemId(null);
      return;
    }

    // 2. If resuming the same item that was previously paused
    if (
      audioRef.current &&
      currentAudioItemIdRef.current === item.id &&
      audioRef.current.paused
    ) {
      try {
        setLoadingAudioItemId(item.id);
        await audioRef.current.play();
        setPlayingItemId(item.id);
        return;
      } catch {
        // If resume fails, reset and proceed to fresh initialization
        stopAndResetCurrentAudio();
      } finally {
        setLoadingAudioItemId(null);
      }
    }

    // 3. Stop & reset previous playback when switching to another item
    stopAndResetCurrentAudio();

    // 4. Retrieve existing audio source; handle unavailable audio gracefully without generating
    const rawAudioSource = getAudioSource(item);
    if (!rawAudioSource) {
      setToast({
        message: 'Audio unavailable: No audio recording exists for this clip.',
        type: 'error',
      });
      return;
    }

    // Convert base64 data URI to a fresh, robust Blob URL for maximum browser audio compatibility
    let playableUrl = rawAudioSource;
    if (rawAudioSource.startsWith('data:')) {
      const blob = dataUriToBlob(rawAudioSource);
      if (blob) {
        playableUrl = URL.createObjectURL(blob);
        activeBlobUrlRef.current = playableUrl;
      }
    }

    // 5. Initialize and play audio
    setLoadingAudioItemId(item.id);
    try {
      const audio = new Audio();
      audioRef.current = audio;
      currentAudioItemIdRef.current = item.id;

      audio.onplaying = () => {
        if (currentAudioItemIdRef.current === item.id) {
          setLoadingAudioItemId(null);
          setPlayingItemId(item.id);
        }
      };

      audio.onended = () => {
        if (currentAudioItemIdRef.current === item.id) {
          setPlayingItemId(null);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }
      };

      audio.onerror = () => {
        // Fallback: If primary audioUrl failed (e.g. expired session blob) and persistent base64 audioData exists
        if (
          item.audioData &&
          playableUrl !== item.audioData &&
          currentAudioItemIdRef.current === item.id
        ) {
          const fallbackBlob = dataUriToBlob(item.audioData);
          const fallbackUrl = fallbackBlob ? URL.createObjectURL(fallbackBlob) : item.audioData;
          if (fallbackBlob) activeBlobUrlRef.current = fallbackUrl;
          playableUrl = fallbackUrl;
          audio.src = fallbackUrl;
          audio.play().catch((err) => {
            handlePlaybackError(item.id, err);
          });
          return;
        }
        handlePlaybackError(item.id);
      };

      audio.src = playableUrl;
      await audio.play();
      setPlayingItemId(item.id);
    } catch (err) {
      // Fallback: If audio.play() threw on primary source (e.g. revoked blob URL), try audioData before surfacing error
      if (
        item.audioData &&
        playableUrl !== item.audioData &&
        currentAudioItemIdRef.current === item.id
      ) {
        try {
          const fallbackBlob = dataUriToBlob(item.audioData);
          const fallbackUrl = fallbackBlob ? URL.createObjectURL(fallbackBlob) : item.audioData;
          if (fallbackBlob) activeBlobUrlRef.current = fallbackUrl;
          if (audioRef.current) {
            audioRef.current.src = fallbackUrl;
            await audioRef.current.play();
            setPlayingItemId(item.id);
            return;
          }
        } catch (fallbackErr) {
          handlePlaybackError(item.id, fallbackErr);
          return;
        }
      }
      handlePlaybackError(item.id, err);
    } finally {
      if (currentAudioItemIdRef.current === item.id) {
        setLoadingAudioItemId(null);
      }
    }
  };

  // Download handler (uses existing audio without re-generation)
  const handleDownload = (item) => {
    const rawAudioSource = getAudioSource(item);

    if (!rawAudioSource) {
      setToast({
        message: 'Download unavailable: No audio recording exists for this clip.',
        type: 'error',
      });
      return;
    }

    let downloadUrl = rawAudioSource;
    let createdUrl = null;
    if (rawAudioSource.startsWith('data:')) {
      const blob = dataUriToBlob(rawAudioSource);
      if (blob) {
        createdUrl = URL.createObjectURL(blob);
        downloadUrl = createdUrl;
      }
    }

    try {
      const filename = `speechengine-${item.id}.mp3`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (createdUrl) {
        setTimeout(() => URL.revokeObjectURL(createdUrl), 5000);
      }
      setToast({ message: `Downloaded ${filename}`, type: 'success' });
    } catch (err) {
      setToast({
        message: `Download failed: ${err.message || 'Unable to trigger download.'}`,
        type: 'error',
      });
    }
  };


  // Toggle favorite handler (client-side only for now — no backend favorite API)
  const handleToggleFavorite = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, isFavorite: !it.isFavorite } : it
      )
    );
    const item = items.find((it) => it.id === id);
    if (item) {
      setToast({
        message: !item.isFavorite ? 'Saved to Starred Favorites' : 'Removed from Starred Favorites',
        type: 'success',
      });
    }
  };

  // Confirm delete handler (persists deletion to PostgreSQL via DELETE /api/history/:id)
  const confirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;

    const targetId = itemToDelete.id;
    setIsDeleting(true);

    try {
      await ttsService.deleteHistoryItem(targetId);

      // Stop audio if deleting the currently active item
      if (currentAudioItemIdRef.current === targetId || playingItemId === targetId) {
        stopAndResetCurrentAudio();
      }

      // Remove from displayed list upon successful deletion
      setItems((prev) => prev.filter((it) => it.id !== targetId));
      setItemToDelete(null);
      setToast({
        message: 'Speech deleted successfully',
        type: 'success',
      });
    } catch (err) {
      console.error('[HistoryPage] Failed to delete speech:', err);
      // Keep the item visible in the list and show error toast
      setItemToDelete(null);
      setToast({
        message: err?.message || 'Failed to delete speech clip. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
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
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      }
      if (selectedSort === 'duration') {
        return (b.duration || 0) - (a.duration || 0);
      }
      // 'latest' default — API already returns newest first
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

      {/* History Items List, Skeletons, Error, or Empty State */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
          </>
        ) : fetchError ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40">
            <AlertTriangle className="w-10 h-10 text-red-400 dark:text-red-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Failed to load history
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-sm mx-auto">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={fetchHistory}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
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
          onClick={() => !isDeleting && setItemToDelete(null)}
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
                disabled={isDeleting}
                onClick={() => !isDeleting && setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 inline-flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete Clip'}
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
