import test from 'node:test';
import assert from 'node:assert/strict';
import { CoreService } from '../src/modules/core/core.service.mjs';

test('getProjectSnapshot composes project and modules without business assumptions', async () => {
  const repository = {
    async getProjectBySlug(slug) {
      assert.equal(slug, 'pichasso');
      return { id: 'project-1', slug: 'pichasso', name: 'Pichasso', status: 'draft' };
    },
    async listModules(projectId) {
      assert.equal(projectId, 'project-1');
      return [];
    }
  };

  const service = new CoreService(repository);
  assert.deepEqual(await service.getProjectSnapshot('pichasso'), {
    project: { id: 'project-1', slug: 'pichasso', name: 'Pichasso', status: 'draft' },
    modules: []
  });
});

test('getProjectSnapshot returns null for an unknown project', async () => {
  const service = new CoreService({
    async getProjectBySlug() { return null; },
    async listModules() { throw new Error('must not be called'); }
  });

  assert.equal(await service.getProjectSnapshot('missing'), null);
});

test('getProjectMedia resolves the slug before listing assets', async () => {
  const service = new CoreService({
    async getProjectBySlug(slug) {
      assert.equal(slug, 'pichasso');
      return { id: 'project-1', slug: 'pichasso', name: 'Pichasso', status: 'draft' };
    },
    async listMediaAssets(projectId, options) {
      assert.equal(projectId, 'project-1');
      assert.deepEqual(options, { moduleId: 'module-1' });
      return [{ id: 'asset-1' }];
    }
  });

  const result = await service.getProjectMedia('pichasso', { moduleId: 'module-1' });
  assert.deepEqual(result.assets, [{ id: 'asset-1' }]);
  assert.equal(result.project.id, 'project-1');
});

test('getProjectMedia returns null for an unknown project', async () => {
  const service = new CoreService({
    async getProjectBySlug() { return null; },
    async listMediaAssets() { throw new Error('must not be called'); }
  });

  assert.equal(await service.getProjectMedia('missing'), null);
});
