import { PichassoApi } from './api-client.js';
import { mountViewer } from './viewer.js';
import { mountAdmin } from './admin.js';

const apiBaseUrl = window.__PICHASSO_CONFIG__?.apiBaseUrl || 'http://localhost:10000';
const api = new PichassoApi(apiBaseUrl);
const params = new URLSearchParams(window.location.search);

function showFatal(error) {
  document.querySelectorAll('#app > section').forEach((section) => { section.hidden = true; });
  const view = document.querySelector('#fatalError');
  document.querySelector('#fatalErrorMessage').textContent = error.message || 'Beklenmeyen bir hata oluştu.';
  view.hidden = false;
}

function mountLanding() {
  const view = document.querySelector('#landingView');
  const form = document.querySelector('#openLibraryForm');
  view.hidden = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const slug = String(new FormData(form).get('library') || '').trim().toLowerCase();
    if (!slug) return;
    const url = new URL(window.location.origin);
    url.searchParams.set('library', slug);
    window.location.assign(url);
  });
}

async function boot() {
  if (params.has('admin')) {
    mountAdmin({ api });
    return;
  }

  const slug = params.get('library');
  if (slug) {
    await mountViewer({ api, slug });
    return;
  }

  mountLanding();
}

boot().catch(showFatal);
