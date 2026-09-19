-- Migration: 002_remove_tts_advanced_controls.sql
-- Description: Remove deprecated advanced TTS controls (speed, pitch, volume) from public.speeches table.
-- Existing speech records are preserved with text, language, voice, audio_url, duration, ownership, etc.

ALTER TABLE speeches
    DROP COLUMN IF EXISTS speed CASCADE,
    DROP COLUMN IF EXISTS pitch CASCADE,
    DROP COLUMN IF EXISTS volume CASCADE;
