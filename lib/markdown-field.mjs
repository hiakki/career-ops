// Pure pipeline field escaping, safe to import without loading scanner config.
export function sanitizeMarkdownField(value) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
    .replace(/[\\[\]]/g, '\\$&')
    .replace(/\|/g, '/');
}
