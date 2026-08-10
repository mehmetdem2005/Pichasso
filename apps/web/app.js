import { getJson, PROJECT_SLUG } from '/api.js';

const status = document.querySelector('#status');
const modulesRoot = document.querySelector('#modules');
const galleryRoot = document.querySelector('#gallery');
const emptyState = document.querySelector('#empty');

function onRetry() {
  status.textContent = 'Sunucu uyanıyor, ilk açılış bir dakikayı bulabilir…';
}

function renderGallery(assets) {
  if (assets.length === 0) {
    galleryRoot.hidden = true;
    emptyState.hidden = false;
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
  emptyState.hidden = true;
}

async function boot() {
  try {
    const payload = await getJson(`/api/v1/project?slug=${PROJECT_SLUG}`, { onRetry });
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
    const media = await getJson(`/api/v1/media?slug=${PROJECT_SLUG}`, { onRetry });
    renderGallery(Array.isArray(media.assets) ? media.assets : []);
  } catch (error) {
    console.error(error);
  }
}

boot();
