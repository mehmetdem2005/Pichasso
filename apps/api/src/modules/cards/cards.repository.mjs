import { validateHumorCard } from '../../../../../packages/contracts/humor-card.mjs';

export class CardsRepository {
  constructor(db) { this.db = db; }

  async listPublished({ signal } = {}) {
    const rows = await this.db.select('humor_cards', {
      select: 'id,slug,eyebrow,title,body,module_type,payload,sort_order',
      is_published: 'eq.true',
      order: 'sort_order.asc'
    }, { signal });

    if (!Array.isArray(rows)) throw new TypeError('Unexpected database response');

    return rows.map((row) => validateHumorCard({
      id: row.id,
      slug: row.slug,
      eyebrow: row.eyebrow,
      title: row.title,
      body: row.body,
      moduleType: row.module_type,
      payload: row.payload ?? {},
      sortOrder: row.sort_order
    }));
  }
}
