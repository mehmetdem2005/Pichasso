function setVisible(element, visible) {
  element.hidden = !visible;
}

export async function mountViewer({ api, slug }) {
  const view = document.querySelector('#viewerView');
  const title = document.querySelector('#viewerTitle');
  const stage = document.querySelector('#slideStage');
  const empty = document.querySelector('#viewerEmpty');
  const controls = document.querySelector('#viewerControls');
  const photo = document.querySelector('#slidePhoto');
  const fallback = document.querySelector('#slideFallback');
  const question = document.querySelector('#slideQuestion');
  const body = document.querySelector('#slideBody');
  const counter = document.querySelector('#viewerCounter');
  const progress = document.querySelector('#viewerProgress');
  const backdrop = document.querySelector('#pageBackdrop');
  const back = document.querySelector('#backButton');
  const next = document.querySelector('#nextButton');
  const share = document.querySelector('#shareButton');

  setVisible(view, true);
  const payload = await api.getPublicLibrary(slug);
  const slides = payload.slides ?? [];
  let index = 0;
  let touchStartX = null;

  document.title = `${payload.library.title} · Pichasso`;
  title.textContent = payload.library.title;
  document.documentElement.style.setProperty('--accent', payload.library.theme?.accent || '#ffcf70');
  document.documentElement.style.setProperty('--page', payload.library.theme?.background || '#16130f');

  if (slides.length === 0) {
    setVisible(empty, true);
    setVisible(stage, false);
    setVisible(controls, false);
    counter.textContent = payload.library.description || '';
    return;
  }

  setVisible(stage, true);
  setVisible(controls, true);
  progress.replaceChildren(...slides.map((_, dotIndex) => {
    const dot = document.createElement('button');
    dot.className = 'progress-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `${dotIndex + 1}. karta git`);
    dot.addEventListener('click', () => goTo(dotIndex));
    return dot;
  }));

  function render() {
    const slide = slides[index];
    question.textContent = slide.question;
    body.textContent = slide.body || '';
    body.hidden = !slide.body;
    photo.hidden = !slide.imageUrl;
    fallback.hidden = Boolean(slide.imageUrl);
    if (slide.imageUrl) {
      photo.src = slide.imageUrl;
      photo.alt = slide.imageAlt || '';
    } else {
      photo.removeAttribute('src');
      photo.alt = '';
    }

    backdrop.style.backgroundImage = slide.backgroundImageUrl ? `url("${slide.backgroundImageUrl}")` : 'none';
    counter.textContent = `${index + 1} / ${slides.length}`;
    back.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    [...progress.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === index)));

    const upcoming = slides[index + 1];
    if (upcoming?.imageUrl) new Image().src = upcoming.imageUrl;
    if (upcoming?.backgroundImageUrl) new Image().src = upcoming.backgroundImageUrl;
  }

  function goTo(nextIndex) {
    const bounded = Math.max(0, Math.min(nextIndex, slides.length - 1));
    if (bounded === index) return;
    stage.classList.add('is-changing');
    window.setTimeout(() => {
      index = bounded;
      render();
      requestAnimationFrame(() => stage.classList.remove('is-changing'));
    }, 140);
  }

  back.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(index - 1);
    if (event.key === 'ArrowRight') goTo(index + 1);
  });
  stage.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    if (touchStartX == null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) >= 48) goTo(delta > 0 ? index - 1 : index + 1);
  }, { passive: true });

  share.addEventListener('click', async () => {
    const shareData = { title: payload.library.title, text: payload.library.description, url: window.location.href };
    if (navigator.share) await navigator.share(shareData).catch(() => {});
    else await navigator.clipboard.writeText(window.location.href);
  });

  render();
}
