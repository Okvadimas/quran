/**
 * Normalizes text from Kemenag / EQuran.id database.
 * Fixes legacy Windows-1252 / CP1252 encoding artifacts (such as 0x91 and 0x92)
 * which convert to unprintable C1 control characters (U+0080 to U+009F),
 * causing "tofu" boxes with crosses (⯐) in modern browser fonts.
 */
export function sanitizeKemenagText(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    // Map Windows-1252 quotation and punctuation marks
    .replace(/\u0091/g, '‘') // Left single quote / ‘ain
    .replace(/\u0092/g, '’') // Right single quote / hamzah / apostrophe
    .replace(/\u0093/g, '“') // Left double quote
    .replace(/\u0094/g, '”') // Right double quote
    .replace(/\u0096/g, '–') // En-dash
    .replace(/\u0097/g, '—') // Em-dash
    // Remove any remaining unprintable C1 control characters (0x80 to 0x9F)
    .replace(/[\u0080-\u009F]/g, '')
    // Normalize any redundant multiple spaces created by legacy spacing
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

