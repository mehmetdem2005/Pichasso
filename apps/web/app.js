const root = document.querySelector('#cards');
const apiBaseUrl = (window.__PICHASSO_CONFIG__?.apiBaseUrl || 'http://localhost:10000').replace(/\/$/, '');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resultStrip(text) { return el('div', 'result-strip', text); }

function appleMeter() {
  const body = el('div', 'module-body');
  const label = el('label', 'meter-label');
  const copy = el('span', '', 'Elma sadakat oranı');
  const value = el('strong', '', '%72');
  const range = el('input', 'range');
  range.type = 'range'; range.min = '0'; range.max = '100'; range.value = '72';
  const result = resultStrip('Makul miktarda elmacılık.');
  range.addEventListener('input', () => {
    const score = Number(range.value); value.textContent = `%${score}`;
    result.textContent = score > 88 ? 'Elma lobisi seni yönetiyor.' : score > 55 ? 'Makul miktarda elmacılık.' : 'Şüpheli derecede düşük elma bağlılığı.';
  });
  label.append(copy, value); body.append(label, range, result); return body;
}

function lahmacunRadar(card) {
  const body = el('div', 'module-body');
  const choices = el('div', 'choice-grid');
  const result = resultStrip('Acı seviyesi seçilmeden analiz başlamaz.');
  const options = Array.isArray(card.payload?.options) ? card.payload.options : ['Bol acı', 'Orta acı', 'Acısız'];
  for (const option of options) {
    const button = el('button', 'choice', option);
    button.addEventListener('click', () => { result.textContent = `${option}: dosyaya işlendi. Lahmacun istihbaratı güncel.`; });
    choices.append(button);
  }
  body.append(choices, result); return body;
}

function blackoutPalette() {
  const body = el('div', 'module-body blackout-demo');
  const button = el('button', 'primary-button', 'Siyah modu test et');
  const result = resultStrip('Henüz gereksiz miktarda renk var.');
  let active = false;
  button.addEventListener('click', () => {
    active = !active; body.classList.toggle('is-black', active);
    button.textContent = active ? 'Işıkları geri getir' : 'Siyah modu test et';
    result.textContent = active ? 'Renk paleti başarıyla tek renge indirildi.' : 'Henüz gereksiz miktarda renk var.';
  });
  body.append(button, result); return body;
}

function homebodyMode() {
  const body = el('div', 'module-body');
  const button = el('button', 'primary-button', 'Dışarı çıkma talebi gönder');
  const status = el('div', 'home-status');
  const dot = el('span', 'status-dot'); status.append(dot, document.createTextNode(' EV MODU: AKTİF'));
  let attempts = 0;
  button.addEventListener('click', () => {
    attempts += 1;
    button.textContent = attempts < 3 ? 'Talep reddedildi. Tekrar dene' : 'Sistem kararlı: ev modu korunuyor.';
  });
  body.append(button, status); return body;
}

function wolfSignal() {
  const body = el('div', 'module-body wolf-module');
  const button = el('button', 'wolf-button', '◢'); button.setAttribute('aria-label', 'Kurt sinyali gönder');
  const count = el('div', '', '0 kurt sinyali gönderildi.');
  const note = el('small', '', 'Ses efekti yerine komşularla ilişkiler korunmuştur.');
  let howls = 0; button.addEventListener('click', () => { howls += 1; count.textContent = `${howls} kurt sinyali gönderildi.`; });
  body.append(button, count, note); return body;
}

function matchProfile(card) {
  const body = el('div', 'module-body');
  const tags = el('div', 'tag-cloud');
  const values = Array.isArray(card.payload?.tags) ? card.payload.tags : ['160 civarı', 'kumral', 'balık etli'];
  for (const value of values) tags.append(el('span', '', value));
  body.append(tags, resultStrip('Algoritma gereksiz özgüvenle “profil çözüldü” diyor.')); return body;
}

const modules = {
  apple_meter: appleMeter,
  lahmacun_radar: lahmacunRadar,
  blackout_palette: blackoutPalette,
  homebody_mode: homebodyMode,
  wolf_signal: wolfSignal,
  match_profile: matchProfile
};

function renderCard(card, index) {
  const article = el('article', `card card-${(index % 3) + 1}`);
  const header = document.createElement('header');
  header.append(
    el('span', '', `${String(index + 1).padStart(2, '0')} / ${card.eyebrow}`),
    el('h2', '', card.title),
    el('p', '', card.body)
  );
  const renderModule = modules[card.moduleType];
  article.append(header, renderModule ? renderModule(card) : resultStrip('Bu modül henüz tanımlı değil.'));
  return article;
}

async function boot() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/cards`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.cards)) throw new Error('Invalid API response');
    root.replaceChildren(...payload.cards.map(renderCard));
  } catch (error) {
    console.error(error);
    root.replaceChildren(el('div', 'system-message error', 'İçerik servisine ulaşılamadı.'));
  }
}

boot();
