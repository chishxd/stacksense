// src/utils/colorUtils.js

/**
 * Determines whether to use black or white text based on the brightness of a hex background color.
 * @param {string} hexColor - The background color in hex format (e.g., "#RRGGBB").
 * @returns {string} - Returns '#000000' (black) or '#FFFFFF' (white).
 */
export function getContrastColor(hexColor) {
  // If the hex color is invalid, default to black
  if (!hexColor || hexColor.length < 7) {
    return "#000000";
  }

  // 1. Remove the '#' and convert the hex string to R, G, B components using non-deprecated methods
  const r = parseInt(hexColor.substring(1, 3), 16); // Red
  const g = parseInt(hexColor.substring(3, 5), 16); // Green
  const b = parseInt(hexColor.substring(5, 7), 16); // Blue

  // 2. Calculate the luminance using the standard formula
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // 3. Return black for light backgrounds, white for dark backgrounds
  return luminance > 128 ? "#000000" : "#FFFFFF";
}
