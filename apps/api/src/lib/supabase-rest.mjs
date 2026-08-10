export class SupabaseRestClient {
  constructor({ baseUrl, serviceRoleKey, fetchImpl = fetch }) {
    this.baseUrl = baseUrl;
    this.serviceRoleKey = serviceRoleKey;
    this.fetchImpl = fetchImpl;
  }

  async select(path, query, { signal } = {}) {
    const url = new URL(`/rest/v1/${path}`, this.baseUrl);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

    const response = await this.fetchImpl(url, {
      method: 'GET',
      signal,
      headers: {
        apikey: this.serviceRoleKey,
        authorization: `Bearer ${this.serviceRoleKey}`,
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 300)}`);
    }
    return response.json();
  }
}
