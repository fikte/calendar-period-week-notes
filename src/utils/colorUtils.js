// src/utils/colorUtils.js

// === Helper Functions and Classes ===
/**
 * Parses an "rgba(r, g, b, a)" string into an object.
 * @param {string} rgbaString The input string.
 * @returns {{r: number, g: number, b: number, a: number} | null}
 */
export function parseRgbaString(rgbaString) {
    if (!rgbaString) return null;
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;
    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
}

/**
 * Blends two RGBA color objects based on a mix factor.
 * @param {{r,g,b,a}} color1 The start color object.
 * @param {{r,g,b,a}} color2 The end color object.
 * @param {number} factor A value from 0 (100% color1) to 1 (100% color2).
 * @returns {string} The resulting "rgba(...)" string.
 */
export function blendRgbaColors(color1, color2, factor) {
    const r = Math.round(color1.r * (1 - factor) + color2.r * factor);
    const g = Math.round(color1.g * (1 - factor) + color2.g * factor);
    const b = Math.round(color1.b * (1 - factor) + color2.b * factor);
    const a = (color1.a * (1 - factor) + color2.a * factor).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}
