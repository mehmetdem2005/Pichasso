export class SupabaseRestClient {
  constructor({ baseUrl, adminKey, fetchImpl = fetch }) {
    this.baseUrl = baseUrl;
    this.adminKey = adminKey;
    this.fetchImpl = fetchImpl;
  }

  async select(path, query, { signal } = {}) {
    const url = new URL(`/rest/v1/${path}`, this.baseUrl);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

    const headers = { apikey: this.adminKey, accept: 'application/json' };
    if (!this.adminKey.startsWith('sb_secret_')) headers.authorization = `Bearer ${this.adminKey}`;

    const response = await this.fetchImpl(url, { method: 'GET', signal, headers });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 300)}`);
    }
    return response.json();
  }
}
