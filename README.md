# Pichasso

Pichasso, fotoğraf ve sorulardan oluşan paylaşılabilir kütüphaneler hazırlamak için geliştirilmiş mobil uyumlu bir içerik stüdyosudur.

## Neler hazır?

- Fotoğraf, kart arka planı, soru ve ek yazı yükleme/düzenleme
- Kart sırasını değiştirme ve silme
- Kütüphane bazında renk teması
- Taslak veya yayında durumu
- `?library=kisa-ad` biçiminde paylaşılabilir bağlantı
- Mobil kaydırma, geri/geç düğmeleri ve klavye yön tuşları
- Private Supabase Storage ve süreli görüntüleme bağlantıları
- Yönetim anahtarının yalnızca API katmanında doğrulanması
- Render için web ve API servis tanımları

## Mimari

Akış: `Browser -> Render Web -> Render API -> Supabase`.

- `apps/web`: Public görüntüleyici ve içerik stüdyosu. Supabase anahtarı içermez.
- `apps/api`: Node.js API ve güvenlik sınırı.
- `apps/api/src/modules/library`: Kütüphane iş kuralları ve veri erişimi.
- `apps/api/src/modules/media`: Süreli yükleme/görüntüleme bağlantıları.
- `packages/contracts`: Sunucuya giren içeriğin doğrulanması.
- `supabase/migrations`: Tablolar, RLS, private bucket ve atomik kayıt fonksiyonu.
- `scripts/check-architecture.mjs`: Katman ihlallerini yakalayan anti-spaghetti kontrolü.
- `render.yaml`: Render Blueprint tanımı; otomatik deploy yapılmamıştır.

## Veri modeli

- `projects`: Uygulama kökü.
- `libraries`: Paylaşılabilir koleksiyon ve tema bilgileri.
- `slides`: Sıralı sorular, yazılar ve medya bağlantıları.
- `media_assets`: Supabase Storage dosya metadata kayıtları.

Storage bucket `pichasso-media` private kalır. Public görüntüleyici dosyanın kalıcı adresini değil, API'nin oluşturduğu süreli bağlantıyı alır.

## Yerel kontrol

```bash
npm install
npm run verify
```

API'yi çalıştırmak için `.env.example` değerlerini gerçek ortam değişkenleri olarak tanımlayıp:

```bash
npm run start:api
```

`apps/web` klasörünü herhangi bir statik sunucuyla açabilirsin. Varsayılan geliştirme API adresi `http://localhost:10000` değeridir.

## Canlıya alma

Henüz canlıya alınmadı. Supabase ve Render üzerinde senin tamamlayacağın adımlar [KURULUM.md](KURULUM.md) dosyasındadır.
