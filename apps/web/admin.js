const EMPTY_SLIDE = () => ({
  question: '',
  body: '',
  imageAlt: '',
  imageAssetId: null,
  backgroundAssetId: null,
  imageUrl: null,
  backgroundImageUrl: null
});

const EMPTY_LIBRARY = () => ({
  slug: '',
  title: '',
  description: '',
  status: 'draft',
  theme: { accent: '#ffcf70', background: '#16130f' },
  slides: [EMPTY_SLIDE()],
  existing: false
});

function slugify(value) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function imageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new TypeError('Görsel okunamadı.'));
    };
    image.src = url;
  });
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

export function mountAdmin({ api }) {
  const refs = {
    view: document.querySelector('#adminView'),
    login: document.querySelector('#adminLogin'),
    loginForm: document.querySelector('#adminLoginForm'),
    keyInput: document.querySelector('#adminKey'),
    loginError: document.querySelector('#loginError'),
    workspace: document.querySelector('#studioWorkspace'),
    list: document.querySelector('#libraryList'),
    newButton: document.querySelector('#newLibraryButton'),
    editorEmpty: document.querySelector('#editorEmpty'),
    editor: document.querySelector('#libraryEditor'),
    editorHeading: document.querySelector('#editorHeading'),
    editorNotice: document.querySelector('#editorNotice'),
    title: document.querySelector('#libraryTitleInput'),
    slug: document.querySelector('#librarySlugInput'),
    status: document.querySelector('#libraryStatusInput'),
    description: document.querySelector('#libraryDescriptionInput'),
    accent: document.querySelector('#libraryAccentInput'),
    background: document.querySelector('#libraryBackgroundInput'),
    slides: document.querySelector('#slidesEditor'),
    addSlide: document.querySelector('#addSlideButton'),
    copyLink: document.querySelector('#copyLinkButton'),
    deleteButton: document.querySelector('#deleteLibraryButton'),
    saveButton: document.querySelector('#saveLibraryButton')
  };

  const state = {
    adminKey: sessionStorage.getItem('pichasso.adminKey') || '',
    project: null,
    libraries: [],
    current: null,
    activeUploads: 0,
    slugWasEdited: false
  };

  refs.view.hidden = false;
  document.title = 'İçerik Stüdyosu · Pichasso';

  function notice(message, type = 'success') {
    refs.editorNotice.textContent = message;
    refs.editorNotice.dataset.type = type;
  }

  async function authenticate(key) {
    refs.loginError.textContent = '';
    try {
      const payload = await api.listLibraries(key);
      state.adminKey = key;
      state.project = payload.project;
      state.libraries = payload.libraries ?? [];
      sessionStorage.setItem('pichasso.adminKey', key);
      refs.login.hidden = true;
      refs.workspace.hidden = false;
      renderLibraryList();
    } catch (error) {
      sessionStorage.removeItem('pichasso.adminKey');
      refs.loginError.textContent = error.message;
      refs.login.hidden = false;
      refs.workspace.hidden = true;
    }
  }

  function renderLibraryList() {
    refs.list.replaceChildren();
    if (state.libraries.length === 0) {
      const empty = createElement('p', 'list-empty', 'Henüz kütüphane yok. “Yeni” ile başlayabilirsin.');
      refs.list.append(empty);
      return;
    }

    for (const library of state.libraries) {
      const button = createElement('button', 'library-list-item');
      button.type = 'button';
      button.dataset.active = String(state.current?.slug === library.slug);
      const text = createElement('span', 'library-list-copy');
      text.append(createElement('strong', '', library.title), createElement('small', '', library.slug));
      const badge = createElement('span', `status-badge status-badge--${library.status}`, library.status === 'published' ? 'Yayında' : 'Taslak');
      button.append(text, badge);
      button.addEventListener('click', () => loadLibrary(library.slug));
      refs.list.append(button);
    }
  }

  function showEditor(library) {
    state.current = library;
    state.slugWasEdited = library.existing;
    refs.editorEmpty.hidden = true;
    refs.editor.hidden = false;
    refs.editorHeading.textContent = library.existing ? library.title : 'Yeni kütüphane';
    refs.title.value = library.title;
    refs.slug.value = library.slug;
    refs.slug.disabled = library.existing;
    refs.status.value = library.status;
    refs.description.value = library.description;
    refs.accent.value = library.theme.accent || '#ffcf70';
    refs.background.value = library.theme.background || '#16130f';
    refs.deleteButton.hidden = !library.existing;
    refs.copyLink.hidden = !library.existing;
    refs.editorNotice.textContent = '';
    renderSlides();
    renderLibraryList();
  }

  async function loadLibrary(slug) {
    notice('Kütüphane yükleniyor…', 'info');
    try {
      const payload = await api.getAdminLibrary(slug, state.adminKey);
      showEditor({
        ...payload.library,
        theme: {
          accent: payload.library.theme?.accent || '#ffcf70',
          background: payload.library.theme?.background || '#16130f'
        },
        slides: (payload.slides ?? []).map((slide) => ({ ...slide })),
        existing: true
      });
    } catch (error) {
      notice(error.message, 'error');
    }
  }

  function bindLibraryFields() {
    refs.title.addEventListener('input', () => {
      state.current.title = refs.title.value;
      refs.editorHeading.textContent = refs.title.value || 'Yeni kütüphane';
      if (!state.slugWasEdited) {
        state.current.slug = slugify(refs.title.value);
        refs.slug.value = state.current.slug;
      }
    });
    refs.slug.addEventListener('input', () => {
      state.slugWasEdited = true;
      refs.slug.value = slugify(refs.slug.value);
      state.current.slug = refs.slug.value;
    });
    refs.status.addEventListener('change', () => { state.current.status = refs.status.value; });
    refs.description.addEventListener('input', () => { state.current.description = refs.description.value; });
    refs.accent.addEventListener('input', () => { state.current.theme.accent = refs.accent.value; });
    refs.background.addEventListener('input', () => { state.current.theme.background = refs.background.value; });
  }

  function renderSlides() {
    refs.slides.replaceChildren();
    if (state.current.slides.length === 0) {
      refs.slides.append(createElement('p', 'list-empty', 'Henüz kart yok. “Kart ekle” düğmesini kullan.'));
      return;
    }

    state.current.slides.forEach((slide, index) => refs.slides.append(createSlideCard(slide, index)));
  }

  function createSlideCard(slide, index) {
    const card = createElement('article', 'slide-editor-card');
    const head = createElement('header', 'slide-editor-head');
    head.append(createElement('strong', '', `Kart ${index + 1}`));
    const actions = createElement('div', 'slide-actions');

    const up = createElement('button', 'tiny-button', '↑');
    up.type = 'button';
    up.title = 'Yukarı taşı';
    up.disabled = index === 0;
    up.addEventListener('click', () => moveSlide(index, index - 1));
    const down = createElement('button', 'tiny-button', '↓');
    down.type = 'button';
    down.title = 'Aşağı taşı';
    down.disabled = index === state.current.slides.length - 1;
    down.addEventListener('click', () => moveSlide(index, index + 1));
    const remove = createElement('button', 'tiny-button tiny-button--danger', 'Sil');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      state.current.slides.splice(index, 1);
      renderSlides();
    });
    actions.append(up, down, remove);
    head.append(actions);

    const grid = createElement('div', 'slide-editor-grid');
    const copy = createElement('div', 'slide-fields');

    const questionLabel = createElement('label', 'field', 'Soru');
    const questionInput = document.createElement('textarea');
    questionInput.rows = 3;
    questionInput.maxLength = 300;
    questionInput.required = true;
    questionInput.placeholder = 'Bu fotoğraf sana neyi hatırlatıyor?';
    questionInput.value = slide.question;
    questionInput.addEventListener('input', () => { slide.question = questionInput.value; });
    questionLabel.append(questionInput);

    const bodyLabel = createElement('label', 'field', 'Ek yazı');
    const bodyInput = document.createElement('textarea');
    bodyInput.rows = 4;
    bodyInput.maxLength = 1200;
    bodyInput.placeholder = 'İstersen sorunun altında açıklama göster.';
    bodyInput.value = slide.body;
    bodyInput.addEventListener('input', () => { slide.body = bodyInput.value; });
    bodyLabel.append(bodyInput);

    const altLabel = createElement('label', 'field', 'Görsel açıklaması');
    const altInput = document.createElement('input');
    altInput.maxLength = 200;
    altInput.placeholder = 'Erişilebilirlik için kısa açıklama';
    altInput.value = slide.imageAlt;
    altInput.addEventListener('input', () => { slide.imageAlt = altInput.value; });
    altLabel.append(altInput);
    copy.append(questionLabel, bodyLabel, altLabel);

    const media = createElement('div', 'media-upload-grid');
    media.append(
      createUploadControl({ slide, index, kind: 'image', label: 'Ana fotoğraf', url: slide.imageUrl }),
      createUploadControl({ slide, index, kind: 'background', label: 'Arka plan', url: slide.backgroundImageUrl })
    );

    grid.append(copy, media);
    card.append(head, grid);
    return card;
  }

  function createUploadControl({ slide, index, kind, label, url }) {
    const wrapper = createElement('div', 'upload-control');
    const preview = createElement('div', 'upload-preview');
    const image = document.createElement('img');
    image.alt = '';
    if (url) image.src = url;
    else image.hidden = true;
    const placeholder = createElement('span', 'upload-placeholder', kind === 'image' ? 'Fotoğraf' : 'Arka plan');
    placeholder.hidden = Boolean(url);
    preview.append(image, placeholder);

    const inputId = `upload-${kind}-${index}`;
    const input = document.createElement('input');
    input.id = inputId;
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/avif';
    input.hidden = true;
    const buttonLabel = createElement('label', 'upload-button', label);
    buttonLabel.htmlFor = inputId;
    const status = createElement('small', 'upload-status', url ? 'Yüklendi' : 'Dosya seç');

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      state.activeUploads += 1;
      refs.saveButton.disabled = true;
      status.textContent = 'Yükleniyor…';
      try {
        const dimensions = await imageDimensions(file);
        const asset = await api.uploadImage({
          projectId: state.project.id,
          file,
          adminKey: state.adminKey,
          dimensions
        });
        const previewUrl = URL.createObjectURL(file);
        if (kind === 'image') {
          slide.imageAssetId = asset.id;
          slide.imageUrl = previewUrl;
        } else {
          slide.backgroundAssetId = asset.id;
          slide.backgroundImageUrl = previewUrl;
        }
        image.src = previewUrl;
        image.hidden = false;
        placeholder.hidden = true;
        status.textContent = 'Yüklendi';
      } catch (error) {
        status.textContent = error.message;
        status.classList.add('is-error');
      } finally {
        state.activeUploads -= 1;
        refs.saveButton.disabled = state.activeUploads > 0;
      }
    });

    wrapper.append(preview, input, buttonLabel, status);
    return wrapper;
  }

  function moveSlide(from, to) {
    const [slide] = state.current.slides.splice(from, 1);
    state.current.slides.splice(to, 0, slide);
    renderSlides();
  }

  refs.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    authenticate(refs.keyInput.value);
  });

  refs.newButton.addEventListener('click', () => showEditor(EMPTY_LIBRARY()));
  refs.addSlide.addEventListener('click', () => {
    state.current.slides.push(EMPTY_SLIDE());
    renderSlides();
  });

  refs.editor.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.activeUploads > 0) return notice('Görsellerin yüklenmesini bekle.', 'error');
    if (!state.current.slug) return notice('Kısa ad boş bırakılamaz.', 'error');

    refs.saveButton.disabled = true;
    notice('Kaydediliyor…', 'info');
    try {
      const payload = await api.saveLibrary(state.current.slug, {
        slug: state.current.slug,
        title: state.current.title,
        description: state.current.description,
        status: state.current.status,
        theme: state.current.theme,
        slides: state.current.slides.map((slide) => ({
          question: slide.question,
          body: slide.body,
          imageAlt: slide.imageAlt,
          imageAssetId: slide.imageAssetId,
          backgroundAssetId: slide.backgroundAssetId
        }))
      }, state.adminKey);

      const listPayload = await api.listLibraries(state.adminKey);
      state.libraries = listPayload.libraries ?? [];
      showEditor({ ...payload.library, slides: payload.slides, existing: true });
      notice('Kütüphane kaydedildi.', 'success');
    } catch (error) {
      notice(error.message, 'error');
    } finally {
      refs.saveButton.disabled = false;
    }
  });

  refs.copyLink.addEventListener('click', async () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('library', state.current.slug);
    await navigator.clipboard.writeText(url.toString());
    notice(state.current.status === 'published' ? 'Paylaşım bağlantısı kopyalandı.' : 'Bağlantı kopyalandı; açılması için önce “Yayında” olarak kaydet.', 'info');
  });

  refs.deleteButton.addEventListener('click', async () => {
    if (!window.confirm(`“${state.current.title}” kütüphanesi silinsin mi?`)) return;
    try {
      await api.deleteLibrary(state.current.slug, state.adminKey);
      const payload = await api.listLibraries(state.adminKey);
      state.libraries = payload.libraries ?? [];
      state.current = null;
      refs.editor.hidden = true;
      refs.editorEmpty.hidden = false;
      renderLibraryList();
    } catch (error) {
      notice(error.message, 'error');
    }
  });

  bindLibraryFields();
  if (state.adminKey) {
    refs.keyInput.value = state.adminKey;
    authenticate(state.adminKey);
  }
}
