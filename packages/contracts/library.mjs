const LIBRARY_STATUSES = new Set(['draft', 'published']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new RangeError(`${field} is too long`);
  return normalized;
}

function optionalText(value, field, maxLength) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') throw new TypeError(`${field} must be text`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new RangeError(`${field} is too long`);
  return normalized;
}

function optionalUuid(value, field) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new TypeError(`${field} must be a UUID`);
  return value;
}

function color(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) throw new TypeError('Theme colors must use #RRGGBB');
  return value.toLowerCase();
}

export function validateLibraryDraft(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Library must be an object');

  const slug = requiredText(value.slug, 'slug', 80).toLowerCase();
  if (!SLUG_PATTERN.test(slug)) throw new TypeError('slug must contain lowercase letters, numbers and single dashes');

  const status = value.status ?? 'draft';
  if (!LIBRARY_STATUSES.has(status)) throw new TypeError('Invalid library status');

  const rawSlides = Array.isArray(value.slides) ? value.slides : [];
  if (rawSlides.length > 100) throw new RangeError('A library can contain at most 100 slides');

  const slides = rawSlides.map((slide, index) => {
    if (!slide || typeof slide !== 'object' || Array.isArray(slide)) throw new TypeError(`Invalid slide at ${index}`);
    return Object.freeze({
      question: requiredText(slide.question, `slides[${index}].question`, 300),
      body: optionalText(slide.body, `slides[${index}].body`, 1200),
      imageAlt: optionalText(slide.imageAlt, `slides[${index}].imageAlt`, 200),
      imageAssetId: optionalUuid(slide.imageAssetId, `slides[${index}].imageAssetId`),
      backgroundAssetId: optionalUuid(slide.backgroundAssetId, `slides[${index}].backgroundAssetId`),
      position: index
    });
  });

  return Object.freeze({
    slug,
    title: requiredText(value.title, 'title', 120),
    description: optionalText(value.description, 'description', 500),
    status,
    theme: Object.freeze({
      accent: color(value.theme?.accent, '#ffcf70'),
      background: color(value.theme?.background, '#16130f')
    }),
    slides
  });
}
