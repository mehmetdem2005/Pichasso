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
