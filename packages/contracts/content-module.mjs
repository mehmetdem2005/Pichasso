const MODULE_STATUSES = new Set(['draft', 'ready', 'published', 'disabled']);

export function validateContentModule(value) {
  if (!value || typeof value !== 'object') throw new TypeError('Module must be an object');
  for (const field of ['id', 'projectId', 'key', 'kind', 'status']) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      throw new TypeError(`Invalid module field: ${field}`);
    }
  }
  if (!MODULE_STATUSES.has(value.status)) throw new TypeError('Invalid module status');
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0) throw new TypeError('Invalid sortOrder');
  if (!value.config || typeof value.config !== 'object' || Array.isArray(value.config)) {
    throw new TypeError('Invalid module config');
  }
  return value;
}
