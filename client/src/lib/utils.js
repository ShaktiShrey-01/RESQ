// lib/utils.js
// Simple classname utility function
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .map(cls => typeof cls === 'string' ? cls : '')
    .join(' ')
    .trim();
}