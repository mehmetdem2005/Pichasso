export const HUMOR_MODULE_TYPES = Object.freeze([
  'apple_meter',
  'lahmacun_radar',
  'blackout_palette',
  'homebody_mode',
  'wolf_signal',
  'match_profile'
]);

const typeSet = new Set(HUMOR_MODULE_TYPES);

export function validateHumorCard(value) {
  if (!value || typeof value !== 'object') throw new TypeError('Card must be an object');
  const requiredStrings = ['id', 'slug', 'eyebrow', 'title', 'body'];
  for (const field of requiredStrings) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      throw new TypeError(`Invalid card field: ${field}`);
    }
  }
  if (!typeSet.has(value.moduleType)) throw new TypeError('Invalid moduleType');
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0) throw new TypeError('Invalid sortOrder');
  if (!value.payload || typeof value.payload !== 'object' || Array.isArray(value.payload)) {
    throw new TypeError('Invalid payload');
  }
  return value;
}
