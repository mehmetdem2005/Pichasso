import { apiBaseUrl, getJson, PROJECT_SLUG } from '/api.js';

const KEY_STORAGE = 'pichasso.adminKey';

const form = document.querySelector('#form');
const keyInput = document.querySelector('#key');
const filesInput = document.querySelector('#files');
const submitButton = document.querySelector('#submit');
const status = document.querySelector('#status');
const results = document.querySelector('#results');

keyInput.value = sessionStorage.getItem(KEY_STORAGE) ?? '';

function report(name, state, detail = '') {
  const item = document.createElement('li');
  item.className = `result result--${state}`;
  item.textContent = detail ? `${name} — ${detail}` : name;
  results.append(item);
  return item;
}

async function readDimensions(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error('Görsel okunamadı')), { once: true });
      image.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } catch {
    return { width: null, height: null };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function postJson(path, adminKey, body) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `API ${response.status}`);
  return payload;
}

async function uploadOne(file, projectId, adminKey) {
  const upload = await postJson('/api/v1/admin/media/sign-upload', adminKey, {
    projectId,
    filename: file.name,
    mimeType: file.type
  });

  const stored = await fetch(upload.signedUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type },
    body: file
  });
  if (!stored.ok) throw new Error(`Depolama ${stored.status}`);

  const { width, height } = await readDimensions(file);

  await postJson('/api/v1/admin/media/complete', adminKey, {
    projectId,
    path: upload.path,
    originalName: file.name,
    mimeType: file.type,
    byteSize: file.size,
    width,
    height
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const adminKey = keyInput.value.trim();
  const files = [...filesInput.files];

  if (!adminKey) return void (status.textContent = 'Yönetici anahtarı gerekli.');
  if (files.length === 0) return void (status.textContent = 'En az bir fotoğraf seç.');

  submitButton.disabled = true;
  results.replaceChildren();
  status.textContent = 'Proje bilgisi alınıyor…';

  let projectId;
  try {
    const snapshot = await getJson(`/api/v1/project?slug=${PROJECT_SLUG}`);
    projectId = snapshot.project.id;
  } catch (error) {
    console.error(error);
    status.textContent = 'API bağlantısı kurulamadı.';
    submitButton.disabled = false;
    return;
  }

  let uploaded = 0;
  for (const [index, file] of files.entries()) {
    status.textContent = `Yükleniyor ${index + 1}/${files.length}…`;
    try {
      await uploadOne(file, projectId, adminKey);
      uploaded += 1;
      report(file.name, 'ok', 'yüklendi');
    } catch (error) {
      console.error(error);
      report(file.name, 'fail', error.message);
    }
  }

  sessionStorage.setItem(KEY_STORAGE, adminKey);
  status.textContent = `${uploaded}/${files.length} fotoğraf yüklendi.`;
  submitButton.disabled = false;
  filesInput.value = '';
});
