import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaService } from '../src/modules/media/media.service.mjs';

function storageStub(handlers) {
  return {
    storage: {
      from(bucket) {
        assert.equal(bucket, 'pichasso-media');
        return handlers;
      }
    }
  };
}

test('createSignedUpload keeps uploads inside a project-scoped path', async () => {
  let requestedPath = null;
  const service = new MediaService({
    bucket: 'pichasso-media',
    client: storageStub({
      async createSignedUploadUrl(path) {
        requestedPath = path;
        return { data: { token: 'token-1', signedUrl: 'https://storage.example/upload' }, error: null };
      }
    })
  });

  const result = await service.createSignedUpload({
    projectId: 'project-1',
    filename: 'photo.PNG',
    mimeType: 'image/png'
  });

  assert.match(requestedPath, /^projects\/project-1\/unassigned\/[0-9a-f-]{36}\.png$/);
  assert.equal(result.bucket, 'pichasso-media');
  assert.equal(result.token, 'token-1');
});

test('createSignedUpload rejects unsupported image types', async () => {
  const service = new MediaService({ bucket: 'pichasso-media', client: storageStub({}) });

  await assert.rejects(
    () => service.createSignedUpload({ projectId: 'project-1', filename: 'clip.gif', mimeType: 'image/gif' }),
    TypeError
  );
});

test('attachSignedUrls returns readable assets without leaking storage layout', async () => {
  const service = new MediaService({
    bucket: 'pichasso-media',
    client: storageStub({
      async createSignedUrls(paths, expiresIn) {
        assert.deepEqual(paths, ['projects/p1/unassigned/a.png']);
        assert.equal(expiresIn, 600);
        return { data: [{ path: 'projects/p1/unassigned/a.png', signedUrl: 'https://storage.example/a.png?token=1' }], error: null };
      }
    })
  });

  const assets = await service.attachSignedUrls([
    { id: 'asset-1', bucket: 'pichasso-media', path: 'projects/p1/unassigned/a.png', originalName: 'a.png' },
    { id: 'asset-2', bucket: 'other-bucket', path: 'projects/p1/unassigned/b.png', originalName: 'b.png' }
  ]);

  assert.equal(assets.length, 1);
  assert.equal(assets[0].url, 'https://storage.example/a.png?token=1');
  assert.equal('path' in assets[0], false);
  assert.equal('bucket' in assets[0], false);
});

test('attachSignedUrls short-circuits when nothing is readable', async () => {
  const service = new MediaService({
    bucket: 'pichasso-media',
    client: storageStub({
      async createSignedUrls() { throw new Error('must not be called'); }
    })
  });

  assert.deepEqual(await service.attachSignedUrls([]), []);
});
