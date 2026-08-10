create table if not exists public.libraries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  status text not null default 'draft' check (status in ('draft', 'published')),
  theme jsonb not null default '{"accent":"#ffcf70","background":"#16130f"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries(id) on delete cascade,
  position integer not null check (position >= 0),
  question text not null check (char_length(question) between 1 and 300),
  body text not null default '' check (char_length(body) <= 1200),
  image_alt text not null default '' check (char_length(image_alt) <= 200),
  image_asset_id uuid references public.media_assets(id) on delete set null,
  background_asset_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (library_id, position)
);

create index if not exists libraries_project_status_idx on public.libraries(project_id, status);
create index if not exists slides_library_position_idx on public.slides(library_id, position);

alter table public.libraries enable row level security;
alter table public.slides enable row level security;
revoke all on table public.libraries from anon, authenticated;
revoke all on table public.slides from anon, authenticated;

drop trigger if exists libraries_set_updated_at on public.libraries;
create trigger libraries_set_updated_at
before update on public.libraries
for each row execute function public.set_updated_at();

drop trigger if exists slides_set_updated_at on public.slides;
create trigger slides_set_updated_at
before update on public.slides
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pichasso-media',
  'pichasso-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.save_library_content(
  p_project_slug text,
  p_library jsonb,
  p_slides jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_project_id uuid;
  v_library_id uuid;
  v_slide jsonb;
  v_position integer := 0;
begin
  select id into v_project_id from public.projects where slug = p_project_slug;
  if v_project_id is null then
    raise exception 'project_not_found';
  end if;

  insert into public.libraries (project_id, slug, title, description, status, theme)
  values (
    v_project_id,
    p_library->>'slug',
    p_library->>'title',
    coalesce(p_library->>'description', ''),
    coalesce(p_library->>'status', 'draft'),
    coalesce(p_library->'theme', '{}'::jsonb)
  )
  on conflict (project_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    theme = excluded.theme
  returning id into v_library_id;

  delete from public.slides where library_id = v_library_id;

  for v_slide in select value from jsonb_array_elements(coalesce(p_slides, '[]'::jsonb))
  loop
    insert into public.slides (
      library_id,
      position,
      question,
      body,
      image_alt,
      image_asset_id,
      background_asset_id
    ) values (
      v_library_id,
      v_position,
      v_slide->>'question',
      coalesce(v_slide->>'body', ''),
      coalesce(v_slide->>'imageAlt', ''),
      nullif(v_slide->>'imageAssetId', '')::uuid,
      nullif(v_slide->>'backgroundAssetId', '')::uuid
    );
    v_position := v_position + 1;
  end loop;

  return v_library_id;
end;
$$;

revoke all on function public.save_library_content(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_library_content(text, jsonb, jsonb) to service_role;
