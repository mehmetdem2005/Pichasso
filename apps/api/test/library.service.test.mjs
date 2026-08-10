import test from 'node:test';
import assert from 'node:assert/strict';
import { LibraryService } from '../src/modules/library/library.service.mjs';

const PROJECT = { id: '11111111-1111-4111-8111-111111111111', slug: 'pichasso', name: 'Pichasso', status: 'draft' };
const LIBRARY = {
  id: '22222222-2222-4222-8222-222222222222',
  project_id: PROJECT.id,
  slug: 'hasan-test',
  title: 'Hasan Testi',
  description: 'Kısa açıklama',
  status: 'published',
  theme: { accent: '#ffcf70', background: '#16130f' },
  updated_at: '2026-08-10T00:00:00.000Z'
};
const IMAGE_ID = '33333333-3333-4333-8333-333333333333';

function createService(overrides = {}) {
  const calls = [];
  const repository = {
    async getProjectBySlug(slug) { calls.push(['project', slug]); return PROJECT; },
    async getLibraryBySlug(projectId, slug, options) {
      calls.push(['library', projectId, slug, options]);
      return LIBRARY;
    },
    async listSlides() {
      return [{
        id: '44444444-4444-4444-8444-444444444444',
        position: 0,
        question: 'Bu kim?',
        body: 'Bir açıklama',
        image_alt: 'Hasan',
        image_asset_id: IMAGE_ID,
        background_asset_id: null
      }];
    },
    async listMediaAssets(ids) {
      assert.deepEqual(ids, [IMAGE_ID]);
      return [{ id: IMAGE_ID, storage_bucket: 'pichasso-media', storage_path: 'a.webp' }];
    },
    async saveLibrary(projectSlug, library) { calls.push(['save', projectSlug, library]); },
    ...overrides
  };
  const mediaService = {
    async createSignedReadUrls() { return new Map([[IMAGE_ID, 'https://signed.example/image']]); }
  };
  return { service: new LibraryService({ repository, mediaService }), calls };
}

test('public library requires published content and returns signed media URLs', async () => {
  const { service, calls } = createService();
  const result = await service.getPublicLibrary('pichasso', 'hasan-test');

  assert.equal(result.library.slug, 'hasan-test');
  assert.equal(result.slides[0].imageUrl, 'https://signed.example/image');
  assert.deepEqual(calls[1], ['library', PROJECT.id, 'hasan-test', { publishedOnly: true }]);
});

test('save validates and normalizes library content before repository access', async () => {
  const { service, calls } = createService();
  await service.saveLibrary('pichasso', {
    slug: 'hasan-test',
    title: '  Hasan Testi  ',
    status: 'draft',
    theme: { accent: '#FFCF70', background: '#16130F' },
    slides: [{ question: '  Bu kim?  ', body: '', imageAssetId: IMAGE_ID }]
  });

  const saved = calls.find(([name]) => name === 'save')[2];
  assert.equal(saved.title, 'Hasan Testi');
  assert.equal(saved.theme.accent, '#ffcf70');
  assert.equal(saved.slides[0].question, 'Bu kim?');
});

test('save rejects invalid slugs before repository access', async () => {
  const { service, calls } = createService();
  await assert.rejects(
    service.saveLibrary('pichasso', { slug: 'Bozuk Slug', title: 'Test', slides: [] }),
    /slug/
  );
  assert.equal(calls.some(([name]) => name === 'save'), false);
});
