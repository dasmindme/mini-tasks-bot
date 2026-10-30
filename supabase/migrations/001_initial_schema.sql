-- Soft Checklist: initial schema
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  language_code text,
  timezone text default 'Europe/Moscow',
  reminders_enabled boolean default false,
  reminder_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  icon text default '♡',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  type text not null check (type in ('once', 'daily')),
  task_date date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint tasks_once_requires_date check (
    type <> 'once' or task_date is not null
  )
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  date date not null,
  completed_at timestamptz default now(),
  unique (task_id, date)
);

create index if not exists categories_user_idx on public.categories(user_id);
create index if not exists tasks_user_idx on public.tasks(user_id);
create index if not exists tasks_active_idx on public.tasks(user_id, is_active);
create index if not exists tasks_date_idx on public.tasks(user_id, task_date);
create index if not exists completions_user_date_idx on public.task_completions(user_id, date);

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- Row Level Security: no policies on purpose.
-- The frontend uses the anon key only to call Edge Functions.
-- Edge Functions use the service role key and bypass RLS.
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;