# Pichasso — Supabase ve Render Kurulumu

Kod hazırdır; aşağıdaki işlemler hesap sahipliği ve gizli anahtar gerektirdiği için manuel bırakılmıştır.

## 0. Paylaşılan eski anahtarları iptal et

Sohbette daha önce görünen Supabase ve Render anahtarları ifşa olmuş kabul edilmelidir. Bunları kullanma.

- Supabase: `Account Settings -> Access Tokens`
- Render: `Account Settings -> API Keys`

Bu proje için Render API anahtarı gerekmiyor. GitHub deposunu Render'a bağlamak yeterlidir.

## 1. Supabase migration'larını uygula

1. Supabase Dashboard'da kullanacağın projeyi aç.
2. `SQL Editor -> New query` ekranına gir.
3. Önce `supabase/migrations/001_init.sql` dosyasının tamamını çalıştır.
4. Ardından `supabase/migrations/002_content_studio.sql` dosyasının tamamını çalıştır.
5. `Table Editor` içinde şu tabloların oluştuğunu doğrula:
   - `projects`
   - `modules`
   - `media_assets`
   - `libraries`
   - `slides`
6. `Storage` bölümünde private `pichasso-media` bucket'ının oluştuğunu doğrula.

İkinci migration bucket'ı şu kurallarla oluşturur:

- Public: kapalı
- Maksimum boyut: 10 MB
- Dosya türleri: JPEG, PNG, WebP, AVIF

## 2. Supabase sunucu bilgilerini al

Supabase projesinde:

1. `Settings -> API Keys` bölümünden yeni bir **Secret Key** oluştur.
2. `Settings -> Data API` bölümünden Project URL değerini al.

Bu değerleri GitHub'a, HTML/JS dosyalarına veya normal mesaja yazma. Yalnızca Render API servisinin Environment alanına ekle.

## 3. ADMIN_API_KEY üret

En az 32 karakterlik rastgele bir değer üret. Örnek komut:

```bash
openssl rand -hex 32
```

Bu değer içerik stüdyosuna girişte kullanılacak. Kaynağa yazma; Render Environment alanında tut.

## 4. Render Blueprint oluştur

1. Render Dashboard'da `New -> Blueprint` seç.
2. GitHub'dan `mehmetdem2005/Pichasso` deposunu bağla.
3. Render, kökteki `render.yaml` dosyasını okuyarak iki servis gösterecek:
   - `pichasso-api`
   - `pichasso-web`
4. Blueprint'i oluştur fakat aşağıdaki değerleri doğru girmeden web adresini paylaşma.

## 5. API servisinin Environment değerleri

`pichasso-api -> Environment` bölümüne:

```text
SUPABASE_URL=https://PROJE_KODU.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_API_KEY=urettigin_en_az_32_karakterlik_deger
MEDIA_BUCKET=pichasso-media
WEB_ORIGIN=https://PICHASSO-WEB-ADRESIN.onrender.com
```

`SUPABASE_SECRET_KEY` yalnızca API servisinde bulunmalıdır.

## 6. Web servisinin Environment değeri

`pichasso-web -> Environment` bölümüne:

```text
API_BASE_URL=https://PICHASSO-API-ADRESIN.onrender.com
```

Bu değeri ekledikten sonra web servisine `Manual Deploy -> Deploy latest commit` uygula. Build sırasında `apps/web/config.js` güvenli API adresiyle yeniden oluşturulur.

## 7. Karşılıklı adresleri tamamla

Render ilk oluşturma sırasında URL'leri sonradan verdiği için iki değeri kontrol et:

- API'deki `WEB_ORIGIN`, web servisinin tam HTTPS adresi olmalı.
- Web'deki `API_BASE_URL`, API servisinin tam HTTPS adresi olmalı.

Değerleri düzelttikten sonra önce API'yi, sonra web servisini yeniden deploy et.

## 8. Sağlık ve kullanım kontrolü

API sağlık adresi:

```text
https://PICHASSO-API-ADRESIN.onrender.com/health
```

Beklenen cevap:

```json
{"status":"ok"}
```

İçerik stüdyosu:

```text
https://PICHASSO-WEB-ADRESIN.onrender.com/?admin=1
```

Burada `ADMIN_API_KEY` değerini gir, yeni kütüphane oluştur, fotoğrafları ve yazıları yükle, durumu `Yayında` yapıp kaydet.

Paylaşım bağlantısı şu biçimde oluşur:

```text
https://PICHASSO-WEB-ADRESIN.onrender.com/?library=kutuphane-kisa-adi
```

## 9. Son güvenlik kontrolü

- `SUPABASE_SECRET_KEY` hiçbir web/HTML/JS dosyasında bulunmamalı.
- `ADMIN_API_KEY` en az 32 rastgele karakter olmalı.
- `pichasso-media` bucket private kalmalı.
- Herhangi bir anahtar yanlışlıkla GitHub'a gönderildiyse anahtarı hemen iptal edip yenisini oluştur.
- Render loglarında anahtarları yazdırma.
