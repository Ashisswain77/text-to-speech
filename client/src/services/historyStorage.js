/**
 * Storage and state management for Speech History & Starred Favorites
 *
 * Provides persistent localStorage operations, validation,
 * and data synchronization between History and Favorites.
 */

export const STORAGE_KEY_HISTORY = 'speechengine_history';
export const STORAGE_KEY_FAVORITES = 'speechengine_favorites';

export const MOCK_HISTORY = [
  {
    id: 'hist-1',
    title: "Brand Anthem Voiceover",
    text: "Artificial intelligence has transformed the landscape of synthetic voice production, allowing creators to produce lifelike narration with nuanced emotional cadence.",
    language: "English (US)",
    langCode: "en-US",
    voice: "Sarah (Female)",
    voiceId: "sarah",
    duration: "00:48",
    createdDate: "Today, 2:15 PM",
    addedDate: "Sep 7, 2026",
    isFavorite: true,
  },
  {
    id: 'hist-2',
    title: "Neural Text Processing",
    text: "Welcome to our introductory module on neural text processing. Please follow along with the transcript below.",
    language: "English (US)",
    langCode: "en-US",
    voice: "David (Male)",
    voiceId: "david",
    duration: "00:22",
    createdDate: "Yesterday, 10:30 AM",
    addedDate: "Yesterday, 10:30 AM",
    isFavorite: false,
  },
  {
    id: 'hist-3',
    title: "Hindi Product Walkthrough",
    text: "नमस्ते और वोकलिस में आपका स्वागत है। हमारी तंत्रिका आवाज प्रणाली प्राकृतिक भाषण उत्पन्न करती है।",
    language: "Hindi",
    langCode: "hi-IN",
    voice: "Priya (Female)",
    voiceId: "priya",
    duration: "00:35",
    createdDate: "Sep 6, 2026",
    addedDate: "Sep 6, 2026",
    isFavorite: true,
  },
  {
    id: 'hist-4',
    title: "French Studio Audio",
    text: "Ce projet vous permet de convertir n'importe quel texte écrit en audio de qualité studio avec une clarté remarquable.",
    language: "French",
    langCode: "fr-FR",
    voice: "Chloé (Female)",
    voiceId: "chloe",
    duration: "00:41",
    createdDate: "Sep 5, 2026",
    addedDate: "Sep 5, 2026",
    isFavorite: false,
  },
];

export const INITIAL_FAVORITES = [
  {
    id: 'hist-1',
    title: "Brand Anthem Voiceover",
    text: "Artificial intelligence has transformed the landscape of synthetic voice production, allowing creators to produce lifelike narration with nuanced emotional cadence.",
    language: "English (US)",
    voice: "Sarah — Female",
    duration: "00:48",
    addedDate: "Sep 7, 2026",
  },
  {
    id: 'hist-3',
    title: "Hindi Product Walkthrough",
    text: "नमस्ते और वोकलिस में आपका स्वागत है। हमारी तंत्रिका आवाज प्रणाली प्राकृतिक भाषण उत्पन्न करती है।",
    language: "Hindi",
    voice: "Priya — Female",
    duration: "00:35",
    addedDate: "Sep 6, 2026",
  },
  {
    id: 'fav-3',
    title: "Keynote Narration Sample",
    text: "Every great invention begins with a clear articulation of purpose and vision.",
    language: "English (US)",
    voice: "David — Male",
    duration: "00:19",
    addedDate: "Sep 4, 2026",
  },
];

/**
 * Validates a history item structure to safeguard against corrupted data
 */
function isValidHistoryItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.text === 'string'
  );
}

/**
 * Retrieve persistent history list from localStorage with fallback to initial mock data.
 */
export function getStoredHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidHistoryItem);
      }
    }
  } catch (err) {
    console.warn('Failed to read history from localStorage:', err);
  }

  // Initialize storage on first run
  saveHistory(MOCK_HISTORY);
  return MOCK_HISTORY;
}

/**
 * Persist history items to localStorage with safety against storage quota exhaustion.
 */
export function saveHistory(items) {
  if (!Array.isArray(items)) return;
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
  } catch (err) {
    console.warn('LocalStorage error on saving history; stripping heavy audio data:', err);
    try {
      // Strip heavy base64 strings if storage quota is constrained
      const stripped = items.map(({ audioData: _audioData, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(stripped));
    } catch (fallbackErr) {
      console.error('Critical localStorage failure:', fallbackErr);
    }
  }
}

/**
 * Add a new history item to the top of the list.
 */
export function addHistoryItem(item) {
  if (!isValidHistoryItem(item)) return;
  const current = getStoredHistory();
  // Avoid duplicates by id
  const filtered = current.filter((it) => it.id !== item.id);
  const updated = [item, ...filtered];
  saveHistory(updated);
  return updated;
}

/**
 * Update an existing history item by ID.
 */
export function updateHistoryItem(id, updates) {
  const current = getStoredHistory();
  const updated = current.map((it) => (it.id === id ? { ...it, ...updates } : it));
  saveHistory(updated);
  return updated;
}

/**
 * Permanently delete a history item by ID and synchronize favorites.
 */
export function deleteStoredHistoryItem(id) {
  const current = getStoredHistory();
  const updated = current.filter((it) => it.id !== id);
  saveHistory(updated);

  // Synchronize deletion with favorites if present
  try {
    const favorites = getStoredFavorites();
    const updatedFavs = favorites.filter((fav) => fav.id !== id);
    saveFavorites(updatedFavs);
  } catch {}

  return updated;
}

/**
 * Toggle favorite state for a history item, persisting to both history and favorites.
 */
export function toggleStoredFavorite(id) {
  const current = getStoredHistory();
  let targetItem = null;

  const updated = current.map((it) => {
    if (it.id === id) {
      const nextState = !it.isFavorite;
      targetItem = { ...it, isFavorite: nextState };
      return targetItem;
    }
    return it;
  });

  saveHistory(updated);

  // Synchronize with favorites
  if (targetItem) {
    const currentFavorites = getStoredFavorites();
    if (targetItem.isFavorite) {
      // Add to favorites if not already present
      const alreadyFav = currentFavorites.some((fav) => fav.id === targetItem.id);
      if (!alreadyFav) {
        const favEntry = {
          id: targetItem.id,
          title: targetItem.title || targetItem.text.slice(0, 35) + (targetItem.text.length > 35 ? '...' : ''),
          text: targetItem.text,
          language: targetItem.language,
          voice: targetItem.voice,
          duration: targetItem.duration,
          addedDate: targetItem.createdDate || 'Today',
          audioUrl: targetItem.audioUrl,
          audioData: targetItem.audioData,
        };
        saveFavorites([favEntry, ...currentFavorites]);
      }
    } else {
      // Remove from favorites
      const filteredFavs = currentFavorites.filter((fav) => fav.id !== targetItem.id);
      saveFavorites(filteredFavs);
    }
  }

  return updated;
}

/**
 * Get stored favorites list.
 */
export function getStoredFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read favorites from localStorage:', err);
  }

  // Initialize with default favorites
  saveFavorites(INITIAL_FAVORITES);
  return INITIAL_FAVORITES;
}

/**
 * Persist favorites list.
 */
export function saveFavorites(favorites) {
  if (!Array.isArray(favorites)) return;
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
  } catch (err) {
    console.warn('LocalStorage error on saving favorites:', err);
  }
}

/**
 * Remove a favorite by ID and sync history isFavorite state.
 */
export function removeStoredFavorite(id) {
  const current = getStoredFavorites();
  const updated = current.filter((fav) => fav.id !== id);
  saveFavorites(updated);

  // Also toggle isFavorite to false in history if matching id
  const history = getStoredHistory();
  const updatedHistory = history.map((it) => (it.id === id ? { ...it, isFavorite: false } : it));
  saveHistory(updatedHistory);

  return updated;
}

/**
 * Map history item parameters to backend TTS API payload
 */
export function mapItemToApiPayload(item) {
  let language = item.langCode || 'en-US';
  const langLower = (item.language || '').toLowerCase();
  if (langLower.includes('hindi') || langLower.includes('hi')) language = 'hi-IN';
  else if (langLower.includes('french') || langLower.includes('fr')) language = 'fr-FR';
  else if (langLower.includes('spanish') || langLower.includes('es')) language = 'es-ES';
  else if (langLower.includes('german') || langLower.includes('de')) language = 'de-DE';

  let voice = item.voiceId || 'sarah';
  const voiceLower = (item.voice || '').toLowerCase();
  if (voiceLower.includes('david')) voice = 'david';
  else if (voiceLower.includes('priya')) voice = 'priya';
  else if (voiceLower.includes('chlo') || voiceLower.includes('chloe')) voice = 'chloe';

  return {
    text: item.text,
    language,
    voice,
  };
}

/**
 * Safely converts a base64 Data URI (data:audio/mpeg;base64,...) into a Blob.
 *
 * @param {string} dataUri
 * @returns {Blob|null}
 */
export function dataUriToBlob(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  try {
    const parts = dataUri.split(',');
    if (parts.length < 2) return null;
    const header = parts[0];
    const base64 = parts[1];
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'audio/mpeg';
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch (err) {
    console.warn('Failed converting data URI to Blob:', err);
    return null;
  }
}

/**
 * Safely extracts a playable audio source (audioUrl or persistent audioData) from a history item.
 * Prioritizes persistent audioData when audioUrl is a volatile/session-scoped blob URL.
 *
 * @param {object} item - The history item
 * @returns {string|null} - Playable audio URL or null if none available
 */
export function getAudioSource(item) {
  if (!item || typeof item !== 'object') return null;

  // 1. If persistent audioData is available, prefer it over volatile/session-scoped blob URLs
  if (typeof item.audioData === 'string' && item.audioData.trim().length > 0) {
    return item.audioData.trim();
  }

  // 2. If audioUrl is available (e.g. backend server URL or active blob)
  if (typeof item.audioUrl === 'string' && item.audioUrl.trim().length > 0) {
    return item.audioUrl.trim();
  }

  return null;
}

