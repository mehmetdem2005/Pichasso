const apiBaseUrl = (window.__PICHASSO_CONFIG__?.apiBaseUrl || 'http://localhost:10000').replace(/\/$/, '');
const status = document.querySelector('#status');
const modulesRoot = document.querySelector('#modules');
const galleryRoot = document.querySelector('#gallery');

async function getJson(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

function renderGallery(assets) {
  if (assets.length === 0) {
    galleryRoot.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const asset of assets) {
    const image = document.createElement('img');
    image.src = asset.url;
    image.alt = asset.originalName ?? '';
    image.loading = 'lazy';
    image.decoding = 'async';
    if (asset.width) image.width = asset.width;
    if (asset.height) image.height = asset.height;

    const figure = document.createElement('figure');
    figure.append(image);
    fragment.append(figure);
  }

  galleryRoot.replaceChildren(fragment);
  galleryRoot.hidden = false;
}

async function boot() {
  try {
    const payload = await getJson('/api/v1/project?slug=pichasso');
    const modules = Array.isArray(payload.modules) ? payload.modules : [];

    status.textContent = modules.length === 0
      ? 'Altyapı hazır. Henüz içerik/modül tanımlanmadı.'
      : `${modules.length} modül yapılandırıldı.`;

    modulesRoot.hidden = true;
  } catch (error) {
    console.error(error);
    status.textContent = 'API bağlantısı kurulamadı.';
    return;
  }

  try {
    const media = await getJson('/api/v1/media?slug=pichasso');
    renderGallery(Array.isArray(media.assets) ? media.assets : []);
  } catch (error) {
    console.error(error);
  }
}

boot();
