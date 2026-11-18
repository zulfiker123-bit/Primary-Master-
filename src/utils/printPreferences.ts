import { useEffect, useState } from 'react';

export interface PrintPreferences {
  marginMm: number;
  fontSizeMode: 'auto' | 'custom';
  fontSizePx: number;
}

const STORAGE_KEY = 'app_print_preferences_v1';
const CHANGE_EVENT = 'app-print-preferences-changed';
const GLOBAL_STYLE_ID = 'global-user-print-preferences-style';

export const DEFAULT_PRINT_PREFERENCES: PrintPreferences = {
  marginMm: 0,
  fontSizeMode: 'auto',
  fontSizePx: 14,
};

export const MARGIN_PRESETS = [
  { value: 0, label: '০ মিমি (মার্জিনবিহীন)' },
  { value: 5, label: '৫ মিমি (খুবই কম)' },
  { value: 10, label: '১০ মিমি (কম)' },
  { value: 12.7, label: '১২.৭ মিমি (Narrow)' },
  { value: 15, label: '১৫ মিমি (মধ্যম)' },
  { value: 20, label: '২০ মিমি (স্বাভাবিক)' },
] as const;

export const FONT_SIZE_PRESETS = [11, 12, 13, 14, 15, 16, 18, 20] as const;

export function getPrintPreferences(): PrintPreferences {
  if (typeof window === 'undefined') return DEFAULT_PRINT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<PrintPreferences>;
    const marginMm =
      typeof parsed.marginMm === 'number' && Number.isFinite(parsed.marginMm)
        ? Math.max(0, Math.min(40, parsed.marginMm))
        : 0;
    const fontSizeMode = parsed.fontSizeMode === 'custom' ? 'custom' : 'auto';
    const fontSizePx =
      typeof parsed.fontSizePx === 'number' && Number.isFinite(parsed.fontSizePx)
        ? Math.max(9, Math.min(28, parsed.fontSizePx))
        : 14;
    return { marginMm, fontSizeMode, fontSizePx };
  } catch {
    return DEFAULT_PRINT_PREFERENCES;
  }
}

export function buildCustomPrintFontCss(prefs: PrintPreferences): string {
  if (prefs.fontSizeMode !== 'custom') return '';
  const px = Math.max(9, Math.min(28, prefs.fontSizePx));
  return `
    .print-only-sheet:not(.preserve-card-scale),
    .a4-paper-sheet:not(.preserve-card-scale),
    .a4-landscape-sheet:not(.preserve-card-scale) {
      font-size: ${px}px !important;
    }
    .print-only-sheet:not(.preserve-card-scale) p,
    .print-only-sheet:not(.preserve-card-scale) li,
    .print-only-sheet:not(.preserve-card-scale) td,
    .print-only-sheet:not(.preserve-card-scale) th,
    .a4-paper-sheet:not(.preserve-card-scale) p,
    .a4-paper-sheet:not(.preserve-card-scale) li,
    .a4-paper-sheet:not(.preserve-card-scale) td,
    .a4-paper-sheet:not(.preserve-card-scale) th,
    .a4-landscape-sheet:not(.preserve-card-scale) p,
    .a4-landscape-sheet:not(.preserve-card-scale) li {
      font-size: ${px}px !important;
      line-height: ${px >= 17 ? 1.85 : px >= 14 ? 1.68 : 1.5} !important;
    }
  `;
}

export function applyGlobalPrintPreferenceStyles(prefs: PrintPreferences): void {
  if (typeof document === 'undefined') return;
  let styleEl = document.getElementById(GLOBAL_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = GLOBAL_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  const margin = Math.max(0, Math.min(40, prefs.marginMm));
  const customFontCss = buildCustomPrintFontCss(prefs);

  styleEl.textContent = `
    ${customFontCss}
    @media print {
      @page {
        margin: ${margin}mm !important;
      }
      .print-only-sheet,
      .a4-paper-sheet,
      .a4-landscape-sheet {
        padding: ${margin > 0 ? '0' : '0'} !important;
      }
    }
  `;
}

export function savePrintPreferences(next: PrintPreferences): void {
  if (typeof window === 'undefined') return;
  const sanitized: PrintPreferences = {
    marginMm: Math.max(0, Math.min(40, Number(next.marginMm) || 0)),
    fontSizeMode: next.fontSizeMode === 'custom' ? 'custom' : 'auto',
    fontSizePx: Math.max(9, Math.min(28, Number(next.fontSizePx) || 14)),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore storage quota errors
  }
  applyGlobalPrintPreferenceStyles(sanitized);
  window.dispatchEvent(new CustomEvent<PrintPreferences>(CHANGE_EVENT, { detail: sanitized }));
}

export function usePrintPreferences(): [
  PrintPreferences,
  (updater: Partial<PrintPreferences> | ((prev: PrintPreferences) => PrintPreferences)) => void,
] {
  const [prefs, setPrefs] = useState<PrintPreferences>(() => getPrintPreferences());

  useEffect(() => {
    applyGlobalPrintPreferenceStyles(prefs);
  }, [prefs]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<PrintPreferences>;
      if (custom.detail) {
        setPrefs(custom.detail);
      }
    };
    const storageHandler = () => {
      setPrefs(getPrintPreferences());
    };
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const updatePrefs = (
    updater: Partial<PrintPreferences> | ((prev: PrintPreferences) => PrintPreferences)
  ) => {
    const current = getPrintPreferences();
    const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    savePrintPreferences(next);
    setPrefs(getPrintPreferences());
  };

  return [prefs, updatePrefs];
}
