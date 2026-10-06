-- Sparkle: per-user habit tracker data.
-- Every row belongs to one auth user; RLS restricts each user to their own rows.
-- Run this once in the Supabase SQL editor (or `supabase db push`).

-- ─── Settings (one row per user) ─────────────────────────────────────────────

create table public.user_settings (
  user_id          uuid primary key default auth.uid() references auth.users on delete cascade,
  progress         jsonb not null,                -- UserProgress
  parent_pin       text,                          -- null until the parent creates one
  star_rupee_ratio jsonb,                         -- StarRupeeRatio, null = app default
  updated_at       timestamptz not null default now()
);

-- ─── Habits ───────────────────────────────────────────────────────────────────

create table public.habits (
  user_id           uuid not null default auth.uid() references auth.users on delete cascade,
  id                text not null,
  name              text not null,
  emoji             text not null,
  time_of_day       text not null check (time_of_day in ('morning', 'allday', 'evening')),
  type              text not null check (type in ('once-daily', 'repeatable', 'parent-only')),
  points            int  not null,
  max_per_day       int,
  requires_approval boolean,
  is_archived       boolean not null default false,
  primary key (user_id, id)
);

-- ─── Daily entries ────────────────────────────────────────────────────────────

create table public.daily_entries (
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  id               text not null,                 -- `${habitId}_${dateString}`
  habit_id         text not null,
  date_string      date not null,
  completion_count int  not null,
  approval_status  text not null check (approval_status in ('none', 'pending', 'approved')),
  stars_earned     int  not null default 0,
  bonus_stars      int  not null default 0,
  primary key (user_id, id)
);

create index daily_entries_user_date on public.daily_entries (user_id, date_string);

-- ─── Rewards ──────────────────────────────────────────────────────────────────

create table public.rewards (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  id          text not null,
  name        text not null,
  emoji       text not null,
  thumbnail   text,                               -- base64 data URL
  star_cost   int  not null,
  is_unlocked boolean not null default false,
  unlocked_at bigint,                             -- epoch ms
  primary key (user_id, id)
);

-- ─── Row-level security ───────────────────────────────────────────────────────

alter table public.user_settings enable row level security;
alter table public.habits        enable row level security;
alter table public.daily_entries enable row level security;
alter table public.rewards       enable row level security;

create policy "own rows" on public.user_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.habits for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.daily_entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.rewards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- New Supabase projects don't auto-expose tables to the Data API; grant explicitly.
grant select, insert, update, delete on public.user_settings, public.habits,
  public.daily_entries, public.rewards to authenticated;
