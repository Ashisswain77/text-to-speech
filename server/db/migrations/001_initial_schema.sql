-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Creates initial tables, constraints, and indexes for SpeechEngine:
--              1. users (authentication identity, tier, character limit)
--              2. speeches (synthesis history, audio URL reference, parameters)
-- ============================================================================

-- PostgreSQL 13+ includes gen_random_uuid() natively.
-- Extension check ensures compatibility across environments.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. USERS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL CONSTRAINT check_users_name_not_empty CHECK (char_length(trim(name)) > 0),
    email VARCHAR(255) NOT NULL CONSTRAINT check_users_email_not_empty CHECK (char_length(trim(email)) > 0),
    password_hash VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'free' CONSTRAINT check_users_tier CHECK (tier IN ('free', 'pro', 'enterprise')),
    char_limit INTEGER NOT NULL DEFAULT 5000 CONSTRAINT check_users_char_limit CHECK (char_limit > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Case-insensitive unique index for email to prevent duplicate accounts (e.g. test@example.com vs Test@Example.com)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- ---------------------------------------------------------------------------
-- 2. SPEECHES TABLE
-- ---------------------------------------------------------------------------
-- Referential integrity design:
-- Foreign key uses `ON DELETE RESTRICT` to enforce strict ownership and prevent
-- silent/accidental deletion of speech history if a user record is deleted.
-- Speech history records represent usage logs, quota consumption, and
-- synthesized audio records; any deletion must be explicit and intentional.
CREATE TABLE IF NOT EXISTS speeches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    text VARCHAR(5000) NOT NULL CONSTRAINT check_speeches_text CHECK (char_length(trim(text)) > 0 AND char_length(text) <= 5000),
    language VARCHAR(50) NOT NULL DEFAULT 'en-US',
    voice VARCHAR(100) NOT NULL DEFAULT 'sarah',
    speed NUMERIC(3, 1) NOT NULL DEFAULT 1.0 CONSTRAINT check_speeches_speed CHECK (speed IN (0.5, 1.0, 1.5, 2.0)),
    pitch INTEGER NOT NULL DEFAULT 0 CONSTRAINT check_speeches_pitch CHECK (pitch >= -5 AND pitch <= 5),
    volume INTEGER NOT NULL DEFAULT 100 CONSTRAINT check_speeches_volume CHECK (volume >= 0 AND volume <= 100),
    audio_url TEXT NULL,
    duration NUMERIC(8, 2) NULL CONSTRAINT check_speeches_duration CHECK (duration IS NULL OR duration >= 0),
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_speeches_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------------

-- Primary query pattern: WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_speeches_user_id_created_at ON speeches (user_id, created_at DESC);

-- Direct foreign-key lookup index
CREATE INDEX IF NOT EXISTS idx_speeches_user_id ON speeches (user_id);

-- Chronological index for speeches
CREATE INDEX IF NOT EXISTS idx_speeches_created_at ON speeches (created_at DESC);

-- Partial index for fast retrieval of user favorite speeches
CREATE INDEX IF NOT EXISTS idx_speeches_user_favorites ON speeches (user_id, created_at DESC) WHERE is_favorite = true;

-- ---------------------------------------------------------------------------
-- 4. AUTOMATIC TIMESTAMP TRIGGERS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_speeches_updated_at ON speeches;
CREATE TRIGGER trg_speeches_updated_at
    BEFORE UPDATE ON speeches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
