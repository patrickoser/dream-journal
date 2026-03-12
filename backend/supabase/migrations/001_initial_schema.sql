-- ============================================================
-- Reverie — Initial Schema + Row Level Security Policies
-- Run via: supabase db push (after linking your project)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS table (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium')),
  subscription_expires_at timestamptz,
  generations_used_this_month int not null default 0,
  video_generations_used_this_month int not null default 0,
  revenuecat_customer_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create user record on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reset generation counters monthly (call from a scheduled function)
create or replace function public.reset_monthly_counters()
returns void language plpgsql security definer
as $$
begin
  update public.users
  set
    generations_used_this_month = 0,
    video_generations_used_this_month = 0,
    updated_at = now();
end;
$$;

-- ============================================================
-- DREAM_ENTRIES table
-- ============================================================
create table public.dream_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text,
  body_text   text not null default '',
  dream_date  date not null default current_date,
  mood_tags   text[] not null default '{}',
  has_video   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index dream_entries_user_id_date_idx on public.dream_entries(user_id, dream_date desc);

-- ============================================================
-- DREAM_GENERATIONS table (images, videos, interpretations, manifestations)
-- ============================================================
create table public.dream_generations (
  id            uuid primary key default uuid_generate_v4(),
  entry_id      uuid not null references public.dream_entries(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  type          text not null check (type in ('image', 'video', 'interpretation', 'manifestation')),
  prompt_used   text,
  media_url     text,
  thumbnail_url text,
  is_saved      boolean not null default false,
  created_at    timestamptz not null default now()
);

create index dream_generations_entry_id_idx on public.dream_generations(entry_id);
create index dream_generations_user_saved_idx on public.dream_generations(user_id, is_saved) where is_saved = true;

-- ============================================================
-- GENERATION_JOBS table (async video jobs)
-- ============================================================
create table public.generation_jobs (
  id              uuid primary key default uuid_generate_v4(),
  entry_id        uuid not null references public.dream_entries(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  type            text not null check (type in ('image', 'video')),
  status          text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'failed')),
  provider        text not null check (provider in ('falai', 'kling')),
  provider_job_id text,
  result_url      text,
  error_message   text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index generation_jobs_user_status_idx on public.generation_jobs(user_id, status);

-- ============================================================
-- ROW LEVEL SECURITY — users can only see their own data
-- ============================================================

alter table public.users enable row level security;
alter table public.dream_entries enable row level security;
alter table public.dream_generations enable row level security;
alter table public.generation_jobs enable row level security;

-- Users
create policy "users_own_data" on public.users
  for all using (auth.uid() = id);

-- Dream entries
create policy "entries_own_data" on public.dream_entries
  for all using (auth.uid() = user_id);

-- Dream generations
create policy "generations_own_data" on public.dream_generations
  for all using (auth.uid() = user_id);

-- Generation jobs
create policy "jobs_own_data" on public.generation_jobs
  for all using (auth.uid() = user_id);

-- Service role bypass (for Cloudflare Worker and Edge Functions)
-- The service role key automatically bypasses RLS, so no additional policy needed.
