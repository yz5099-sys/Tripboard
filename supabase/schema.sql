create extension if not exists pgcrypto;

create table if not exists public.patient_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  tumor_type text not null default '',
  surgery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.symptom_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pain integer not null,
  numbness text not null,
  weakness text not null,
  gait text not null,
  bladder text not null,
  night_pain text not null,
  weight_loss text not null,
  risk_level text not null,
  message text not null,
  next_step text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.report_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  extracted_text text not null default '',
  ai_summary text not null,
  risk_level text not null,
  findings jsonb not null default '[]'::jsonb,
  suggestion text not null,
  recommended_review_interval text not null,
  urgent_signals jsonb not null default '[]'::jsonb,
  disclaimer text not null,
  raw_model_text text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patient_profiles_set_updated_at on public.patient_profiles;
create trigger patient_profiles_set_updated_at
before update on public.patient_profiles
for each row execute function public.set_updated_at();

alter table public.patient_profiles enable row level security;
alter table public.symptom_entries enable row level security;
alter table public.report_analyses enable row level security;

drop policy if exists "profiles_select_own" on public.patient_profiles;
create policy "profiles_select_own"
on public.patient_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.patient_profiles;
create policy "profiles_insert_own"
on public.patient_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.patient_profiles;
create policy "profiles_update_own"
on public.patient_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "symptoms_select_own" on public.symptom_entries;
create policy "symptoms_select_own"
on public.symptom_entries
for select
using (auth.uid() = user_id);

drop policy if exists "symptoms_insert_own" on public.symptom_entries;
create policy "symptoms_insert_own"
on public.symptom_entries
for insert
with check (auth.uid() = user_id);

drop policy if exists "reports_select_own" on public.report_analyses;
create policy "reports_select_own"
on public.report_analyses
for select
using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.report_analyses;
create policy "reports_insert_own"
on public.report_analyses
for insert
with check (auth.uid() = user_id);
