import React, { useState, useEffect, useCallback } from 'react';
import { Search, History, AlertTriangle, RefreshCw } from 'lucide-react';
import HistoryItem from '../components/history/HistoryItem';
import { HistoryItemSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { ttsService, ApiError } from '../services/api';
import { useHistoryAudio } from '../hooks/useHistoryAudio';
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

  // Delete confirmation & Toast state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Audio Playback Hook (guarantees single active audio & object URL lifecycle)
  const {
    playingItemId,
    loadingAudioItemId,
    handlePlay,
    stopAudio,
  } = useHistoryAudio({
    onError: (errorMessage) => {
      setToast({
        message: errorMessage,
        type: 'error',
      });
    },
  });

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


  // Toggle favorite handler (persists to PostgreSQL via POST/DELETE /api/history/:id/favorite)
  const handleToggleFavorite = async (id) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    const willFavorite = !item.isFavorite;

    try {
      if (willFavorite) {
        await ttsService.favoriteSpeech(id);
      } else {
        await ttsService.unfavoriteSpeech(id);
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, isFavorite: willFavorite } : it
        )
      );

      setToast({
        message: willFavorite ? 'Saved to Starred Favorites' : 'Removed from Starred Favorites',
        type: 'success',
      });
    } catch (err) {
      console.error('[HistoryPage] Failed to toggle favorite:', err);
      setToast({
        message: err?.message || 'Failed to update favorite status. Please try again.',
        type: 'error',
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
      if (playingItemId === targetId || loadingAudioItemId === targetId) {
        stopAudio();
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
