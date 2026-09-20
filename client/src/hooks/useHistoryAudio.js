import { useState, useRef, useEffect, useCallback } from 'react';
import { getSpeechAudio, ApiError } from '../services/api';

/**
 * Custom hook providing robust single-active-audio playback for historical speeches.
 *
 * Guarantees:
 * 1. Single Active Audio: Starting playback of any item stops and resets any previous audio.
 * 2. Object URL Lifecycle: Every URL created via URL.createObjectURL is tracked and
 *    guaranteed to be revoked via URL.revokeObjectURL on switch, unmount, or stop.
 * 3. Accurate State Machine: Idle -> Loading -> Playing -> Paused -> Ended -> Error.
 * 4. Error Sanitization: Safely catches and propagates user-friendly error messages without
 *    exposing database, Supabase, or internal server details.
 *
 * @param {object} [options]
 * @param {(message: string) => void} [options.onError] - Callback for surfaced playback errors
 * @returns {object} Playback controls and state
 */
export function useHistoryAudio({ onError } = {}) {
  const [playingItemId, setPlayingItemId] = useState(null);
  const [loadingAudioItemId, setLoadingAudioItemId] = useState(null);

  const audioRef = useRef(null);
  const currentAudioItemIdRef = useRef(null);
  const activeBlobUrlRef = useRef(null);
  const onErrorRef = useRef(onError);

  // Keep latest error callback ref without re-binding handlers
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Fully stops audio playback, detaches listeners, revokes object URL, and resets state.
   */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.onplaying = null;
        audioRef.current.onpause = null;
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      } catch {
        // Safe disposal
      }
      audioRef.current = null;
    }

    if (activeBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      } catch {
        // Safe disposal
      }
      activeBlobUrlRef.current = null;
    }

    setPlayingItemId(null);
    setLoadingAudioItemId(null);
    currentAudioItemIdRef.current = null;
  }, []);

  /**
   * Pauses the currently active audio without revoking the blob URL, allowing resume.
   */
  const pauseAudio = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setPlayingItemId(null);
  }, []);

  // Cleanup on component unmount to prevent audio leaks or dangling Object URLs
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  /**
   * Main play/pause/resume toggle handler for a speech item.
   *
   * @param {object} item - Speech item { id, ... }
   */
  const handlePlay = useCallback(async (item) => {
    if (!item) return;

    const speechId = item.id;

    // 1. Validate speech ID
    if (!speechId || typeof speechId !== 'string') {
      const errorMsg = 'Audio unavailable: Invalid speech record ID.';
      if (onErrorRef.current) onErrorRef.current(errorMsg);
      return;
    }

    // 2. If clicking on the currently playing item -> Pause it
    if (currentAudioItemIdRef.current === speechId && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingItemId(null);
      return;
    }

    // 3. If resuming the same item that is currently loaded and paused
    if (
      currentAudioItemIdRef.current === speechId &&
      audioRef.current &&
      audioRef.current.paused &&
      activeBlobUrlRef.current
    ) {
      try {
        setLoadingAudioItemId(speechId);
        await audioRef.current.play();
        setPlayingItemId(speechId);
        return;
      } catch (err) {
        console.warn('[HistoryAudio] Resume failed, reloading speech audio:', err.message);
        stopAudio();
      } finally {
        setLoadingAudioItemId(null);
      }
    }

    // 4. Starting a new speech (or reloading):
    // Stop previous audio and revoke existing Object URL immediately
    stopAudio();

    // Mark as current target and enter loading state
    currentAudioItemIdRef.current = speechId;
    setLoadingAudioItemId(speechId);

    try {
      // 5. Fetch private audio binary as a Blob from the authenticated backend
      const audioBlob = await getSpeechAudio(speechId);

      // Verify the user hasn't switched to another item while the request was in flight
      if (currentAudioItemIdRef.current !== speechId) {
        return;
      }

      // 6. Create temporary object URL for browser playback
      const blobUrl = URL.createObjectURL(audioBlob);
      activeBlobUrlRef.current = blobUrl;

      // 7. Instantiate and configure HTMLAudioElement
      const audio = new Audio();
      audioRef.current = audio;

      audio.onplaying = () => {
        if (currentAudioItemIdRef.current === speechId) {
          setLoadingAudioItemId(null);
          setPlayingItemId(speechId);
        }
      };

      audio.onpause = () => {
        if (currentAudioItemIdRef.current === speechId) {
          setPlayingItemId(null);
        }
      };

      audio.onended = () => {
        if (currentAudioItemIdRef.current === speechId) {
          setPlayingItemId(null);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }
      };

      audio.onerror = () => {
        if (currentAudioItemIdRef.current === speechId) {
          stopAudio();
          const errorMsg = 'Playback error: Audio file could not be played.';
          if (onErrorRef.current) onErrorRef.current(errorMsg);
        }
      };

      audio.src = blobUrl;
      await audio.play();
    } catch (err) {
      // Only process error if this request is still the active speech request
      if (currentAudioItemIdRef.current === speechId) {
        stopAudio();

        let friendlyMessage = 'Unable to play audio recording.';
        if (err instanceof ApiError) {
          if (err.status === 401) {
            friendlyMessage = 'Your session has expired. Please log in again.';
          } else if (err.status === 404) {
            friendlyMessage = err.message || 'Audio not available for this speech.';
          } else if (err.isNetworkError) {
            friendlyMessage = 'Unable to reach the server. Please check your network connection.';
          } else {
            friendlyMessage = err.message || 'Failed to stream speech audio.';
          }
        } else if (err?.message) {
          friendlyMessage = err.message;
        }

        if (onErrorRef.current) {
          onErrorRef.current(friendlyMessage);
        }
      }
    } finally {
      if (currentAudioItemIdRef.current === speechId) {
        setLoadingAudioItemId(null);
      }
    }
  }, [stopAudio]);

  return {
    playingItemId,
    loadingAudioItemId,
    handlePlay,
    pauseAudio,
    stopAudio,
  };
}

export default useHistoryAudio;
