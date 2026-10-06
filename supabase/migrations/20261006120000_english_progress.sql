-- English Time: per-user lesson pointer + spaced-repetition state for learned words.
-- Stored as one jsonb blob (EnglishProgress); null until the first lesson is finished.

alter table public.user_settings add column english_progress jsonb;
