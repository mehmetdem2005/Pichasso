create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null check (char_length(key) between 1 and 80),
  kind text not null default 'unconfigured' check (char_length(kind) between 1 and 120),
  status text not null default 'draft' check (status in ('draft', 'ready', 'published', 'disabled')),
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index if not exists modules_project_sort_idx on public.modules(project_id, sort_order);
create index if not exists media_assets_project_idx on public.media_assets(project_id);
create index if not exists media_assets_module_idx on public.media_assets(module_id);

alter table public.projects enable row level security;
alter table public.modules enable row level security;
alter table public.media_assets enable row level security;

revoke all on table public.projects from anon, authenticated;
revoke all on table public.modules from anon, authenticated;
revoke all on table public.media_assets from anon, authenticated;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

insert into public.projects (slug, name, status)
values ('pichasso', 'Pichasso', 'draft')
on conflict (slug) do update set name = excluded.name;

-- Intentionally no module/content seed data.
-- Modules and their behavior are added only after a concrete idea is approved.
