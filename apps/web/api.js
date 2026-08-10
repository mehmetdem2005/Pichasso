export const apiBaseUrl = (window.__PICHASSO_CONFIG__?.apiBaseUrl || 'http://localhost:10000').replace(/\/$/, '');
export const PROJECT_SLUG = 'pichasso';

// Render's free plan suspends the API after idle time, so the first request of a
// visit can block while the instance wakes up.
const RETRY_DELAYS_MS = [2000, 3000, 5000, 8000, 13000];
const REQUEST_TIMEOUT_MS = 25000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export async function getJson(path, { onRetry } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await requestOnce(path);
    } catch (error) {
      lastError = error;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) break;
      onRetry?.(attempt + 1);
      await wait(delay);
    }
  }

  throw lastError;
}
