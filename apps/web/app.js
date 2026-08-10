const apiBaseUrl = (window.__PICHASSO_CONFIG__?.apiBaseUrl || 'http://localhost:10000').replace(/\/$/, '');
const status = document.querySelector('#status');
const modulesRoot = document.querySelector('#modules');

async function boot() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/project?slug=pichasso`, {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`API ${response.status}`);

    const payload = await response.json();
    const modules = Array.isArray(payload.modules) ? payload.modules : [];

    status.textContent = modules.length === 0
      ? 'Altyapı hazır. Henüz içerik/modül tanımlanmadı.'
      : `${modules.length} modül yapılandırıldı.`;

    modulesRoot.hidden = true;
  } catch (error) {
    console.error(error);
    status.textContent = 'API bağlantısı kurulamadı.';
  }
}

boot();
