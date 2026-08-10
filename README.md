# Pichasso

Kişiye özel mizah modüllerini Supabase verisinden üreten, Render üzerinde web + API olarak ayrılmış bir web uygulaması.

## Mimari

- `apps/web`: Bağımlılıksız statik istemci. Yalnızca Pichasso API ile konuşur.
- `apps/api`: Node.js 20 HTTP servisi. Supabase service-role anahtarının tek sahibi.
- `packages/contracts`: API veri sözleşmesi ve runtime doğrulaması.
- `supabase/migrations`: Şema, RLS ve başlangıç içerikleri.
- `scripts/check-architecture.mjs`: Web/API katman sınırlarını denetleyen anti-spaghetti kontrolü.
- `render.yaml`: Render Blueprint; statik web ve API iki ayrı servis.

Akış: `Browser -> Render Web -> Render API -> Supabase`.

## Neden frontend doğrudan Supabase'e bağlanmıyor?

Service-role anahtarı hiçbir zaman tarayıcıya gitmez. Veri erişimi repository katmanında kalır; route/server, service ve database sorumlulukları birbirine karışmaz. Admin paneli, analitik veya farklı veri kaynağı eklemek gerektiğinde frontend mimarisi değişmez.

## Lokal doğrulama

```bash
npm run verify
```

Bu komut mimari sınır kontrolünü ve Node testlerini çalıştırır. Projede harici npm runtime bağımlılığı yoktur.

## Supabase kurulumu

`supabase/migrations/001_init.sql` dosyasını Supabase SQL Editor veya CLI üzerinden uygula. `humor_cards` tablosu RLS ile kapalıdır; anon/authenticated rolleri tabloya doğrudan erişemez.

Başlangıç verisinde elma, lahmacun, siyah renk, ev modu, kurt ve fiziksel tip tercihi için birbirinden farklı etkileşim modülleri vardır. Sağlık/mental sağlık gibi hassas kişisel bilgi başlangıç verisine bilerek eklenmemiştir.

## Render kurulumu

Repo Render'a Blueprint olarak bağlandığında `render.yaml` iki servis tanımlar.

API secret/env:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEB_ORIGIN` = deploy edilen `pichasso-web` adresi

Web build env:
- `API_BASE_URL` = deploy edilen `pichasso-api` adresi

`WEB_ORIGIN` ve `API_BASE_URL` birbirinin gerçek Render URL'leri ile doldurulmalıdır.
