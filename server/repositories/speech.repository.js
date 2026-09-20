import { query } from '../config/db.js';

/**
 * Format raw database row into a clean, camelCased object.
 *
 * @param {object} row - Raw PostgreSQL row
 * @returns {object|null}
 */
export function formatSpeechRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    language: row.language,
    voice: row.voice,
    audioUrl: row.audio_url,
    duration: row.duration !== null && row.duration !== undefined ? Number(row.duration) : null,
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

/**
 * Inserts a synthesized speech record into PostgreSQL.
 *
 * @param {object} params
 * @param {string} params.userId - Authoritative user UUID
 * @param {string} params.text - Synthesized text
 * @param {string} [params.language='en-US'] - Language code
 * @param {string} [params.voice='sarah'] - SpeechEngine voice identifier
 * @param {string|null} [params.audioUrl=null] - Permanent audio URL (null if binary-only)
 * @param {number|null} [params.duration=null] - Duration in seconds (null if unknown)
 * @param {boolean} [params.isFavorite=false] - Favorite status
 * @returns {Promise<object>} Newly created speech record
 */
export async function createSpeech({
  userId,
  text,
  language = 'en-US',
  voice = 'sarah',
  audioUrl = null,
  duration = null,
  isFavorite = false,
}) {
  const sql = `
    INSERT INTO speeches (
      user_id,
      text,
      language,
      voice,
      audio_url,
      duration,
      is_favorite
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      user_id,
      text,
      language,
      voice,
      audio_url,
      duration,
      is_favorite,
      created_at,
      updated_at;
  `;

  const values = [
    userId,
    text,
    language,
    voice,
    audioUrl,
    duration,
    isFavorite,
  ];

  const result = await query(sql, values);
  return formatSpeechRecord(result.rows[0]);
}

/**
 * Find speech by ID.
 *
 * @param {string} id - Speech UUID
 * @returns {Promise<object|null>}
 */
export async function findSpeechById(id) {
  const sql = `
    SELECT
      id,
      user_id,
      text,
      language,
      voice,
      audio_url,
      duration,
      is_favorite,
      created_at,
      updated_at
    FROM speeches
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  return formatSpeechRecord(result.rows[0]);
}

/**
 * Retrieve all speech records belonging to a specific user.
 *
 * @param {string} userId - Authoritative authenticated user UUID
 * @returns {Promise<object[]>} Array of formatted speech records, newest first
 */
export async function findSpeechesByUserId(userId) {
  const sql = `
    SELECT
      id,
      user_id,
      text,
      language,
      voice,
      audio_url,
      duration,
      is_favorite,
      created_at,
      updated_at
    FROM speeches
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query(sql, [userId]);
  return result.rows.map(formatSpeechRecord);
}

/**
 * Permanently delete a speech record, scoped to a specific owner.
 *
 * The WHERE clause enforces ownership: only the authenticated user's
 * own record can be deleted. If the speech does not exist or belongs
 * to another user, zero rows are affected.
 *
 * @param {string} speechId - Speech UUID to delete
 * @param {string} userId - Authoritative authenticated user UUID
 * @returns {Promise<boolean>} true if a row was deleted, false otherwise
 */
export async function deleteSpeechByIdAndUserId(speechId, userId) {
  // If speechId is not a valid UUID format, it cannot exist in public.speeches
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!speechId || !UUID_REGEX.test(speechId)) {
    return false;
  }

  const sql = `
    DELETE FROM speeches
    WHERE id = $1
      AND user_id = $2;
  `;
  const result = await query(sql, [speechId, userId]);
  return result.rowCount > 0;
}

/**
 * Update the is_favorite status of a speech record, scoped to a specific owner.
 *
 * The WHERE clause enforces ownership: only the authenticated user's
 * own record can be updated. If the speech does not exist or belongs
 * to another user, zero rows are affected.
 *
 * @param {string} speechId - Speech UUID to update
 * @param {string} userId - Authoritative authenticated user UUID
 * @param {boolean} isFavorite - Target boolean favorite status
 * @returns {Promise<object|null>} Formatted updated record, or null if not found/not owned
 */
export async function updateSpeechFavoriteByIdAndUserId(speechId, userId, isFavorite) {
  // If speechId is not a valid UUID format, it cannot exist in public.speeches
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!speechId || !UUID_REGEX.test(speechId)) {
    return null;
  }

  const sql = `
    UPDATE speeches
    SET is_favorite = $1
    WHERE id = $2
      AND user_id = $3
    RETURNING
      id,
      user_id,
      text,
      language,
      voice,
      audio_url,
      duration,
      is_favorite,
      created_at,
      updated_at;
  `;
  const result = await query(sql, [isFavorite, speechId, userId]);
  if (result.rows.length === 0) {
    return null;
  }
  return formatSpeechRecord(result.rows[0]);
}

/**
 * Update the audio_url of a speech record, strictly scoped to the owner.
 *
 * @param {string} speechId - Speech UUID to update
 * @param {string} userId - Authoritative authenticated user UUID
 * @param {string} audioUrl - Storage object reference/path
 * @returns {Promise<object|null>} Formatted updated record, or null if not found/not owned
 */
export async function updateSpeechAudioUrlByIdAndUserId(speechId, userId, audioUrl) {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!speechId || !UUID_REGEX.test(speechId)) {
    return null;
  }

  const sql = `
    UPDATE speeches
    SET audio_url = $1,
        updated_at = NOW()
    WHERE id = $2
      AND user_id = $3
    RETURNING
      id,
      user_id,
      text,
      language,
      voice,
      audio_url,
      duration,
      is_favorite,
      created_at,
      updated_at;
  `;
  const result = await query(sql, [audioUrl, speechId, userId]);
  if (result.rows.length === 0) {
    return null;
  }
  return formatSpeechRecord(result.rows[0]);
}

/**
 * Retrieve the audio reference for a specific speech record, strictly scoped to the owner.
 * Returns only the minimal required fields: id, user_id, audio_url.
 *
 * @param {string} speechId - Speech UUID to locate
 * @param {string} userId - Authoritative authenticated user UUID
 * @returns {Promise<{ id: string, userId: string, audioUrl: string|null }|null>}
 */
export async function getSpeechAudioReferenceByIdAndUserId(speechId, userId) {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!speechId || !UUID_REGEX.test(speechId) || !userId || !UUID_REGEX.test(userId)) {
    return null;
  }

  const sql = `
    SELECT
      id,
      user_id,
      audio_url
    FROM speeches
    WHERE id = $1
      AND user_id = $2
    LIMIT 1;
  `;

  const result = await query(sql, [speechId, userId]);
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    audioUrl: row.audio_url,
  };
}

export default {
  formatSpeechRecord,
  createSpeech,
  findSpeechById,
  findSpeechesByUserId,
  deleteSpeechByIdAndUserId,
  updateSpeechFavoriteByIdAndUserId,
  updateSpeechAudioUrlByIdAndUserId,
  getSpeechAudioReferenceByIdAndUserId,
};
