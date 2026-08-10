create extension if not exists pgcrypto;

create table if not exists public.humor_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 80),
  eyebrow text not null check (char_length(eyebrow) between 1 and 80),
  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) between 1 and 500),
  module_type text not null check (module_type in (
    'apple_meter', 'lahmacun_radar', 'blackout_palette',
    'homebody_mode', 'wolf_signal', 'match_profile'
  )),
  payload jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.humor_cards enable row level security;
revoke all on table public.humor_cards from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists humor_cards_set_updated_at on public.humor_cards;
create trigger humor_cards_set_updated_at
before update on public.humor_cards
for each row execute function public.set_updated_at();

insert into public.humor_cards (slug, eyebrow, title, body, module_type, payload, sort_order, is_published)
values
  ('elma', 'meyve protokolü', 'Elma Endeksi', 'Sevdiği şeyleri normal söylemek yerine bilimsel cihaz varmış gibi ölçüyoruz.', 'apple_meter', '{}', 10, true),
  ('lahmacun', 'kritik altyapı', 'Lahmacun Radarı', 'Asıl karakter testi: acı seviyesi. Sonuçların hukuki bağlayıcılığı yoktur.', 'lahmacun_radar', '{"options":["Bol acı","Orta acı","Acısız"]}', 20, true),
  ('siyah', 'renk departmanı', 'Kromatik Tasarruf', 'Siyah seviyorsa paleti gereksiz yere kalabalık tutmanın anlamı yok.', 'blackout_palette', '{}', 30, true),
  ('ev-modu', 'sosyal batarya', 'Ev Modu İşletim Sistemi', 'Dışarı çıkma talepleri merkezi sistem tarafından değerlendirilir ve çoğunlukla reddedilir.', 'homebody_mode', '{}', 40, true),
  ('kurt', 'vahşi yaşam frekansı', 'Kurt Sinyali', 'Kurt sevgisini gereksiz derecede ciddi bir haberleşme protokolüne çevirdik.', 'wolf_signal', '{}', 50, true),
  ('tip-profili', 'algoritmik dedikodu', 'Algoritmanın Fazla Bildiği Şeyler', 'Tercihleri birkaç etikete indirip yapay zekâymış gibi davranan tamamen gereksiz bir modül.', 'match_profile', '{"tags":["160 civarı","kumral","balık etli"]}', 60, true)
on conflict (slug) do update set
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  body = excluded.body,
  module_type = excluded.module_type,
  payload = excluded.payload,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;
