/**
 * Lazy-loaded A4 PDF exporter using html2canvas + jspdf.
 * Enforces exact A4 dimensions (210x297mm portrait or 297x210mm landscape)
 * with Zero margins (0mm) cleanly rendered across pages, plus single-page
 * full-bleed fitting for Landscape certificates/TCs.
 */

import { buildCustomPrintFontCss, getPrintPreferences } from './printPreferences';

export const A4_ZERO_MARGIN_MM = 0;
export const A4_NARROW_MARGIN_MM = 0;

let colorCanvasCtx: CanvasRenderingContext2D | null = null;

const UNSUPPORTED_COLOR_FN_RE = /(oklch|oklab|color-mix|light-dark|\bcolor)\s*\(/i;

function isUnsupportedColorStr(val: string | null | undefined): boolean {
  return Boolean(val && UNSUPPORTED_COLOR_FN_RE.test(val));
}

function normalizeColorToRgb(colorStr: string, fallback = '#1e293b'): string {
  if (!colorStr) return fallback;
  if (!isUnsupportedColorStr(colorStr)) {
    return colorStr;
  }
  try {
    if (!colorCanvasCtx && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      colorCanvasCtx = c.getContext('2d');
    }
    if (colorCanvasCtx) {
      colorCanvasCtx.fillStyle = '#010203';
      colorCanvasCtx.fillStyle = colorStr;
      const converted = colorCanvasCtx.fillStyle;
      if (
        converted &&
        converted !== '#010203' &&
        !isUnsupportedColorStr(converted)
      ) {
        return converted;
      }
      // Try exact black check in case input legitimately resolved to #010203
      colorCanvasCtx.fillStyle = '#fefefe';
      colorCanvasCtx.fillStyle = colorStr;
      const converted2 = colorCanvasCtx.fillStyle;
      if (converted2 && converted2 !== '#fefefe' && !isUnsupportedColorStr(converted2)) {
        return converted2;
      }
    }
  } catch {
    // Fallback below
  }
  if (colorStr.toLowerCase().includes('transparent') || colorStr.includes('/ 0)')) {
    return 'rgba(0, 0, 0, 0)';
  }
  return fallback;
}

/**
 * Finds and replaces every balanced function call matching `oklch(...)`, `oklab(...)`,
 * `color-mix(...)`, `light-dark(...)`, or `color(...)` — even with nested `var(...)`
 * parentheses inside — with its Canvas-resolved sRGB/RGBA value.
 */
function sanitizeCssTextColors(cssText: string): string {
  if (!cssText || !isUnsupportedColorStr(cssText)) return cssText;

  const fnNames = ['color-mix(', 'light-dark(', 'oklch(', 'oklab(', 'color('];
  let out = '';
  let i = 0;

  while (i < cssText.length) {
    const lowerSlice = cssText.slice(i, i + 12).toLowerCase();
    const matchedFn = fnNames.find((fn) => {
      if (!lowerSlice.startsWith(fn)) return false;
      // Avoid matching `background-color(` or custom-ident-color(
      if (i > 0 && /[a-zA-Z0-9_-]/.test(cssText[i - 1])) return false;
      return true;
    });

    if (!matchedFn) {
      out += cssText[i];
      i += 1;
      continue;
    }

    // Walk balanced parentheses to find the matching closing ')'
    let depth = 0;
    let end = i + matchedFn.length - 1;
    while (end < cssText.length) {
      if (cssText[end] === '(') depth += 1;
      else if (cssText[end] === ')') {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
      end += 1;
    }

    const fullCall = cssText.slice(i, end);
    const fallback = matchedFn === 'color-mix(' ? 'rgba(15, 23, 42, 0.14)' : '#1e293b';
    out += normalizeColorToRgb(fullCall, fallback);
    i = end;
  }

  return out;
}

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  fitSinglePage?: boolean;
}

const SINGLE_COLOR_PROPS: Array<{ js: keyof CSSStyleDeclaration; css: string }> = [
  { js: 'color', css: 'color' },
  { js: 'backgroundColor', css: 'background-color' },
  { js: 'borderTopColor', css: 'border-top-color' },
  { js: 'borderRightColor', css: 'border-right-color' },
  { js: 'borderBottomColor', css: 'border-bottom-color' },
  { js: 'borderLeftColor', css: 'border-left-color' },
  { js: 'outlineColor', css: 'outline-color' },
  { js: 'textDecorationColor', css: 'text-decoration-color' },
  { js: 'webkitTextStrokeColor', css: '-webkit-text-stroke-color' },
  { js: 'caretColor', css: 'caret-color' },
  { js: 'columnRuleColor', css: 'column-rule-color' },
  { js: 'fill', css: 'fill' },
  { js: 'stroke', css: 'stroke' },
];

function sanitizeClonedStylesForHtml2Canvas(
  clonedDoc: Document,
  clonedRoot: HTMLElement,
  orientation: 'portrait' | 'landscape',
  marginMm: number,
  fitSinglePage = false
) {
  // 1. Convert any same-origin <link rel="stylesheet"> into inline sanitized <style>
  //    and sanitize all <style> elements FIRST so CSS variables & rules lose oklch/oklab.
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
    try {
      const sheet = (linkEl as HTMLLinkElement).sheet;
      if (!sheet) return;
      const rules = sheet.cssRules;
      let rawCss = '';
      for (let r = 0; r < rules.length; r += 1) {
        rawCss += rules[r].cssText + '\n';
      }
      if (isUnsupportedColorStr(rawCss)) {
        const replacement = clonedDoc.createElement('style');
        replacement.textContent = sanitizeCssTextColors(rawCss);
        linkEl.parentNode?.insertBefore(replacement, linkEl);
        linkEl.remove();
      }
    } catch {
      // Cross-origin stylesheet (e.g. Google Fonts) — safe to keep as-is
    }
  });

  clonedDoc.querySelectorAll('style').forEach((styleEl) => {
    const css = styleEl.textContent || '';
    if (isUnsupportedColorStr(css)) {
      styleEl.textContent = sanitizeCssTextColors(css);
    }
  });

  // 1b. Apply global user print font preference inside cloned document
  const prefs = getPrintPreferences();
  const customFontCss = buildCustomPrintFontCss(prefs);
  if (customFontCss) {
    const prefStyle = clonedDoc.createElement('style');
    prefStyle.textContent = customFontCss;
    clonedDoc.head.appendChild(prefStyle);
  }

  // 2. Hide UI-only controls inside the captured sheet
  clonedRoot.querySelectorAll('.no-print').forEach((node) => {
    (node as HTMLElement).style.display = 'none';
  });

  // 3. Match exact printable content width inside A4 (Zero Margin = 0mm default)
  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const pageHeightMm = orientation === 'landscape' ? 210 : 297;
  const usableWidthMm = pageWidthMm - marginMm * 2;
  const usableHeightMm = pageHeightMm - marginMm * 2;
  const targetContentWidthPx = Math.round((usableWidthMm / 25.4) * 96);
  const targetContentHeightPx = Math.round((usableHeightMm / 25.4) * 96);

  clonedDoc.body.style.fontFamily = "'Kalpurush', 'Plus Jakarta Sans', system-ui, sans-serif";
  clonedRoot.style.fontFamily = "'Kalpurush', 'Plus Jakarta Sans', system-ui, sans-serif";
  clonedRoot.style.width = `${targetContentWidthPx}px`;
  clonedRoot.style.maxWidth = `${targetContentWidthPx}px`;
  if (fitSinglePage) {
    clonedRoot.style.height = `${targetContentHeightPx}px`;
    clonedRoot.style.minHeight = `${targetContentHeightPx}px`;
    clonedRoot.style.maxHeight = `${targetContentHeightPx}px`;
    clonedRoot.style.overflow = 'hidden';
  } else {
    clonedRoot.style.minHeight = 'auto';
    clonedRoot.style.overflow = 'visible';
  }
  clonedRoot.style.margin = '0';
  clonedRoot.style.padding = '0';
  clonedRoot.style.backgroundColor = '#ffffff';
  clonedRoot.style.boxShadow = 'none';
  clonedRoot.style.borderRadius = '0';

  // Strip outer wrapper card border if present so only internal document borders print cleanly inside A4
  if (
    clonedRoot.classList.contains('print-only-sheet') ||
    clonedRoot.classList.contains('a4-paper-sheet') ||
    clonedRoot.classList.contains('a4-landscape-sheet')
  ) {
    clonedRoot.style.border = 'none';
  }

  // Expand horizontally scrollable wrappers so wide tables never clip in PDF
  clonedRoot
    .querySelectorAll<HTMLElement>('.overflow-x-auto, .max-h-72, .max-h-\\[92vh\\], .max-h-\\[94vh\\]')
    .forEach((wrapper) => {
      wrapper.style.overflow = 'visible';
      wrapper.style.maxHeight = 'none';
    });

  // 4. Resolve computed colors on html, body, clonedRoot, and ALL descendants (including SVGs)
  const win = clonedDoc.defaultView;
  if (win) {
    const targets: HTMLElement[] = [
      clonedDoc.documentElement,
      clonedDoc.body,
      clonedRoot,
      ...Array.from(clonedRoot.querySelectorAll<HTMLElement>('*')),
    ].filter(Boolean);

    for (const el of targets) {
      const inlineStyleAttr = el.getAttribute('style');
      if (inlineStyleAttr && isUnsupportedColorStr(inlineStyleAttr)) {
        el.setAttribute('style', sanitizeCssTextColors(inlineStyleAttr));
      }

      const cs = win.getComputedStyle(el);

      for (const { js, css } of SINGLE_COLOR_PROPS) {
        const val = cs[js] as string | undefined;
        if (val && isUnsupportedColorStr(val)) {
          el.style.setProperty(css, normalizeColorToRgb(val), 'important');
        }
      }

      if (cs.webkitTextStrokeColor && isUnsupportedColorStr(cs.webkitTextStrokeColor)) {
        el.style.setProperty(
          '-webkit-text-stroke-color',
          normalizeColorToRgb(cs.webkitTextStrokeColor),
          'important'
        );
      }

      if (cs.backgroundImage && isUnsupportedColorStr(cs.backgroundImage)) {
        const cleaned = sanitizeCssTextColors(cs.backgroundImage);
        el.style.setProperty(
          'background-image',
          isUnsupportedColorStr(cleaned) ? 'none' : cleaned,
          'important'
        );
      }

      if (cs.boxShadow && isUnsupportedColorStr(cs.boxShadow)) {
        const cleaned = sanitizeCssTextColors(cs.boxShadow);
        el.style.setProperty(
          'box-shadow',
          isUnsupportedColorStr(cleaned) ? 'none' : cleaned,
          'important'
        );
      }

      if (cs.textShadow && isUnsupportedColorStr(cs.textShadow)) {
        const cleaned = sanitizeCssTextColors(cs.textShadow);
        el.style.setProperty(
          'text-shadow',
          isUnsupportedColorStr(cleaned) ? 'none' : cleaned,
          'important'
        );
      }

      if (cs.listStyleImage && isUnsupportedColorStr(cs.listStyleImage)) {
        el.style.setProperty('list-style-image', 'none', 'important');
      }
    }
  }
}

export async function exportElementToA4Pdf(
  element: HTMLElement,
  filename: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const prefs = getPrintPreferences();
  const orientation = options.orientation || 'portrait';
  const marginMm = options.marginMm ?? prefs.marginMm;
  const fitSinglePage = Boolean(options.fitSinglePage);

  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const pageHeightMm = orientation === 'landscape' ? 210 : 297;
  const usableWidthMm = pageWidthMm - marginMm * 2;
  const usableHeightMm = pageHeightMm - marginMm * 2;
  const targetContentWidthPx = Math.round((usableWidthMm / 25.4) * 96);

  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasModule.default;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: targetContentWidthPx,
    onclone: (clonedDoc, clonedEl) => {
      sanitizeClonedStylesForHtml2Canvas(clonedDoc, clonedEl, orientation, marginMm, fitSinglePage);
    },
  });

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (fitSinglePage) {
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', marginMm, marginMm, usableWidthMm, usableHeightMm, undefined, 'FAST');
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeName);
    return;
  }

  // Pixel height corresponding to one A4 Zero-margin printable page
  const pageSliceHeightPx = Math.max(1, Math.floor((usableHeightMm / usableWidthMm) * canvas.width));
  let renderedY = 0;
  let pageIndex = 0;

  while (renderedY < canvas.height) {
    const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - renderedY);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        renderedY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );
    }

    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.96);
    const sliceHeightMm = (sliceHeightPx * usableWidthMm) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage('a4', orientation);
    }

    pdf.addImage(sliceData, 'JPEG', marginMm, marginMm, usableWidthMm, sliceHeightMm, undefined, 'FAST');

    renderedY += sliceHeightPx;
    pageIndex += 1;
  }

  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(safeName);
}
