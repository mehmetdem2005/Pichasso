# Pichasso

Pichasso şu anda yalnızca altyapı içerir. İçerik, mizah, görsel stil ve modül davranışları seed edilmez; her modül ancak fikir onaylandıktan sonra eklenir.

## Mimari

Akış: `Browser -> Render Web -> Render API -> Supabase`.

- `apps/web`: Public istemci kabuğu. Supabase'e doğrudan bağlanmaz.
- `apps/api`: Node.js API. Supabase admin anahtarı yalnızca burada bulunur.
- `apps/api/src/modules/core`: Proje, modül ve medya metadata iş kuralları.
- `apps/api/src/modules/media`: Supabase Storage signed-upload altyapısı.
- `packages/contracts`: Katmanlar arası nötr veri sözleşmeleri.
- `supabase/migrations`: `projects`, `modules`, `media_assets` şeması.
- `scripts/check-architecture.mjs`: Katman sınırlarını denetleyen anti-spaghetti kontrolü.
- `render.yaml`: Render API + static web Blueprint.

## Veri modeli

`projects`
- Uygulama/proje kökü.

`modules`
- Sonradan eklenecek her ayrı fikir/mekanizma için nötr kayıt.
- `kind` ve `config` alanları fikir gelene kadar herhangi bir davranış varsaymaz.

`media_assets`
- Fotoğraf/görsel metadata kaydı.
- Dosyanın kendisi Supabase Storage'da tutulur.
- Bir asset proje geneline veya belirli bir module bağlanabilir.

Başlangıç migration'ında hiçbir mizah içeriği veya örnek modül yoktur.

## Fotoğraf yükleme altyapısı

Supabase Dashboard üzerinden private bir `pichasso-media` bucket oluştur.

Önerilen kısıtlar:
- MIME: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- Maksimum dosya boyutu: ihtiyaca göre belirle; başlangıç için 10 MB uygundur.

API akışı:
1. Admin istemci `POST /api/v1/admin/media/sign-upload` çağırır.
2. API Supabase Storage için signed upload üretir.
3. Dosya Storage'a yüklenir.
4. `POST /api/v1/admin/media/complete` ile `media_assets` metadata kaydı tamamlanır.

Admin uçları `x-admin-key` header'ı ile korunur.

## Ortam değişkenleri

API:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `ADMIN_API_KEY`
- `MEDIA_BUCKET=pichasso-media`
- `WEB_ORIGIN`

Web build:
- `API_BASE_URL`

## Render

`render.yaml` iki servis tanımlar:
- `pichasso-api`
- `pichasso-web`

## Kontrol

```bash
npm run verify
```

Bu komut servis testlerini ve mimari sınır kontrolünü çalıştırır.
