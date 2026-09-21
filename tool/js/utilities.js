window.Utils = (function () {
  const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const reverseHtmlEntities = Object.fromEntries(Object.entries(htmlEntities).map(([k, v]) => [v, k]));

  function words(value) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[A-Za-z0-9]+/g) ?? [];
  }

  function caseConvert(value, mode) {
    if (mode === 'upper') return value.toLocaleUpperCase();
    if (mode === 'lower') return value.toLocaleLowerCase();
    const parts = words(value).map((part) => part.toLocaleLowerCase());
    if (mode === 'snake') return parts.join('_');
    if (mode === 'kebab') return parts.join('-');
    const titled = parts.map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1));
    if (mode === 'title') return titled.join(' ');
    if (mode === 'pascal') return titled.join('');
    return parts.map((part, index) => (index === 0 ? part : part.charAt(0).toLocaleUpperCase() + part.slice(1))).join('');
  }

  function generateSlug(value) {
    return caseConvert(value, 'kebab').replace(/^-+|-+$/g, '');
  }

  function countText(value) {
    const encoder = new TextEncoder();
    return [
      `Characters: ${Array.from(value).length}`,
      `Words: ${value.trim() ? value.trim().split(/\s+/).length : 0}`,
      `Bytes (UTF-8): ${encoder.encode(value).length}`,
      `Lines: ${value ? value.split(/\r\n|\r|\n/).length : 0}`,
    ].join('\n');
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (c) => htmlEntities[c]);
  }

  function unescapeHtml(value) {
    return value.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => reverseHtmlEntities[entity] ?? entity);
  }

  function unicodeEscape(value) {
    return Array.from(value)
      .map((character) => `\\u{${character.codePointAt(0).toString(16).padStart(4, '0')}}`)
      .join('');
  }

  function unicodeUnescape(value) {
    return value.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, braced, fixed) =>
      String.fromCodePoint(parseInt(braced ?? fixed, 16))
    );
  }

  function prettyJson(value) {
    return JSON.stringify(JSON.parse(value), null, 2);
  }

  function minifyJson(value) {
    return JSON.stringify(JSON.parse(value));
  }

  function evaluateJsonPath(json, path) {
    let current = JSON.parse(json);
    const tokens = path.replace(/^\$\.?/, '').match(/[^.[\]]+|\[(\d+)\]/g) ?? [];
    for (const token of tokens) {
      const key = token.startsWith('[') ? Number(token.slice(1, -1)) : token;
      current = current[key];
    }
    return JSON.stringify(current, null, 2) ?? 'undefined';
  }

  function formatDateSummary(value, mode) {
    const date =
      mode === 'unix'
        ? new Date(Number(value) < 10000000000 ? Number(value) * 1000 : Number(value))
        : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid date or timestamp.';
    return [
      `ISO: ${date.toISOString()}`,
      `Local: ${date.toLocaleString()}`,
      `Unix seconds: ${Math.floor(date.getTime() / 1000)}`,
      `Unix milliseconds: ${date.getTime()}`,
    ].join('\n');
  }

  function hexToRgb(value) {
    const hex = value.trim().replace(/^#/, '');
    const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round((h + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [rp, gp, bp] =
      h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return { r: Math.round((rp + m) * 255), g: Math.round((gp + m) * 255), b: Math.round((bp + m) * 255) };
  }

  function parseColorInput(value) {
    const trimmed = value.trim();
    if (trimmed.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(trimmed)) return hexToRgb(trimmed);
    const rgb = trimmed.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i);
    if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    const hsl = trimmed.match(/^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i);
    if (hsl) return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
    return null;
  }

  function luminance({ r, g, b }) {
    const channels = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function testContrast(foreground, background) {
    const fg = parseColorInput(foreground);
    const bg = parseColorInput(background);
    if (!fg || !bg) return 'Contrast: enter two valid colors.';
    const lighter = Math.max(luminance(fg), luminance(bg));
    const darker = Math.min(luminance(fg), luminance(bg));
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return `Contrast ratio: ${ratio.toFixed(2)}:1\nWCAG AA normal text: ${ratio >= 4.5 ? 'Pass' : 'Fail'}\nWCAG AA large text: ${ratio >= 3 ? 'Pass' : 'Fail'}`;
  }

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  function bytesToBase64(bytes) {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function base64ToText(value) {
    const binary = atob(value.trim());
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return textDecoder.decode(bytes);
  }

  function base64UrlToJson(part) {
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.stringify(JSON.parse(base64ToText(padded)), null, 2);
  }

  return {
    caseConvert,
    generateSlug,
    countText,
    escapeHtml,
    unescapeHtml,
    unicodeEscape,
    unicodeUnescape,
    prettyJson,
    minifyJson,
    evaluateJsonPath,
    formatDateSummary,
    parseColorInput,
    rgbToHex,
    rgbToHsl,
    testContrast,
    bytesToBase64,
    base64ToText,
    base64UrlToJson,
    textEncoder,
  };
})();
