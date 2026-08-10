import test from 'node:test';
import assert from 'node:assert/strict';
import { CardsRepository } from '../src/modules/cards/cards.repository.mjs';
import { CardsService } from '../src/modules/cards/cards.service.mjs';

const db = {
  async select() {
    return [{
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'elma', eyebrow: 'meyve', title: 'Elma Endeksi', body: 'Test',
      module_type: 'apple_meter', payload: {}, sort_order: 10
    }];
  }
};

test('service maps database rows to public contract', async () => {
  const service = new CardsService(new CardsRepository(db));
  const result = await service.getPublishedCards();
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].moduleType, 'apple_meter');
  assert.equal('module_type' in result.cards[0], false);
});
