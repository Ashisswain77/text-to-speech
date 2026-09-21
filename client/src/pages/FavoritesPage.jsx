import React, { useState, useEffect, useCallback } from 'react';
import { Star, AlertTriangle, RefreshCw } from 'lucide-react';
import HistoryItem from '../components/history/HistoryItem';
import { HistoryItemSkeleton } from '../components/common/Skeleton';
import Toast from '../components/common/Toast';
import { ttsService, ApiError } from '../services/api';
import { useHistoryAudio } from '../hooks/useHistoryAudio';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
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

  // Fetch history from the authenticated API and filter for favorites
  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await ttsService.getHistory();
      const items = Array.isArray(data?.items) ? data.items : [];
      // Source of truth: only records where isFavorite === true
      setFavorites(items.filter((item) => Boolean(item.isFavorite)));
    } catch (err) {
      console.error('[FavoritesPage] Failed to fetch favorites:', err.message);
      if (err instanceof ApiError && err.status === 401) {
        setFetchError('Your session has expired. Please log in again.');
      } else if (err instanceof ApiError && err.isNetworkError) {
        setFetchError('Unable to connect to the server. Please check your network connection.');
      } else {
        setFetchError(err.message || 'Failed to load starred favorites.');
      }
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Toggle favorite handler: on the Favorites page, toggling an item removes it from favorites
  const handleToggleFavorite = async (id) => {
    try {
      // Backend source of truth: DELETE /api/history/:id/favorite
      await ttsService.unfavoriteSpeech(id);

      // Stop audio if currently playing the item being unfavorited
      if (playingItemId === id || loadingAudioItemId === id) {
        stopAudio();
      }

      // Immediately remove from displayed favorites upon successful response
      setFavorites((prev) => prev.filter((item) => item.id !== id));
      setToast({
        message: 'Removed from Starred Favorites',
        type: 'success',
      });
    } catch (err) {
      console.error('[FavoritesPage] Failed to remove favorite:', err);
      // FAILED unfavorite must NOT remove the item from the UI
      setToast({
        message: err?.message || 'Failed to remove from favorites. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            <span>Starred Favorites</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quick access to your highest rated and pinned speech generations.
          </p>
        </div>

        <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800/60">
          {favorites.length} Saved {favorites.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* Favorites List, Skeletons, Error, or Empty State */}
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
              Failed to load favorites
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-sm mx-auto">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={fetchFavorites}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : favorites.length > 0 ? (
          favorites.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              isPlaying={playingItemId === item.id}
              isLoadingAudio={loadingAudioItemId === item.id}
              onPlay={() => handlePlay(item)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          ))
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No favorite audio clips saved
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Star audio clips from the Create Speech studio or History to access them quickly here.
            </p>
          </div>
        )}
      </div>

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
