import { exportElementToA4Pdf } from './pdfExport';
import { buildCustomPrintFontCss, getPrintPreferences, PrintPreferences } from './printPreferences';

export interface SmartPrintOptions {
  element?: HTMLElement | null;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  fitSinglePage?: boolean;
}

export interface PrintStatusDetail {
  state: 'loading' | 'success' | 'error' | 'idle';
  message: string;
}

function emitPrintStatus(detail: PrintStatusDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<PrintStatusDetail>('app-print-status', { detail }));
}

function applyDynamicA4PrintStyle(
  orientation: 'portrait' | 'landscape',
  prefs: PrintPreferences,
  marginMm: number,
  fitSinglePage = false
) {
  if (typeof document === 'undefined') return;
  const styleId = 'dynamic-a4-narrow-print-page';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const pageW = orientation === 'landscape' ? '297mm' : '210mm';
  const pageH = orientation === 'landscape' ? '210mm' : '297mm';
  const customFontCss = buildCustomPrintFontCss(prefs);

  styleEl.textContent = `
    ${customFontCss}
    @media print {
      @page {
        size: A4 ${orientation};
        margin: ${marginMm}mm !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        ${
          fitSinglePage
            ? `width: ${pageW} !important; height: ${pageH} !important; overflow: hidden !important;`
            : ''
        }
      }
    }
  `;
}

function findPrintableElement(explicit?: HTMLElement | null): HTMLElement | null {
  if (explicit) return explicit;
  if (typeof document === 'undefined') return null;

  const landscapeSheets = Array.from(
    document.querySelectorAll<HTMLElement>('.a4-landscape-sheet')
  ).filter((el) => el.offsetParent !== null);
  if (landscapeSheets.length > 0) return landscapeSheets[landscapeSheets.length - 1];

  const a4Sheets = Array.from(document.querySelectorAll<HTMLElement>('.a4-paper-sheet')).filter(
    (el) => el.offsetParent !== null
  );
  if (a4Sheets.length > 0) return a4Sheets[a4Sheets.length - 1];

  const printSheets = Array.from(document.querySelectorAll<HTMLElement>('.print-only-sheet')).filter(
    (el) => el.offsetParent !== null
  );
  if (printSheets.length > 0) return printSheets[printSheets.length - 1];

  return document.querySelector<HTMLElement>('main') || document.body;
}

/**
 * Triggers native browser printing using user-configured A4 Margin (mm) & Font Size;
 * if blocked by a sandboxed iframe or unsupported WebView, falls back to downloading PDF.
 */
export async function triggerSmartPrint(options: SmartPrintOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const prefs = getPrintPreferences();
  const orientation = options.orientation || 'portrait';
  const marginMm = options.marginMm ?? prefs.marginMm;
  const fitSinglePage = Boolean(options.fitSinglePage);

  applyDynamicA4PrintStyle(orientation, prefs, marginMm, fitSinglePage);

  let beforePrintFired = false;
  const onBeforePrint = () => {
    beforePrintFired = true;
  };
  window.addEventListener('beforeprint', onBeforePrint, { once: true });

  try {
    window.print();
  } catch {
    beforePrintFired = false;
  }

  await new Promise((resolve) => setTimeout(resolve, 220));
  window.removeEventListener('beforeprint', onBeforePrint);

  if (beforePrintFired) {
    return;
  }

  const targetEl = findPrintableElement(options.element);
  if (!targetEl) {
    emitPrintStatus({
      state: 'error',
      message: 'প্রিন্ট করার জন্য কোনো ডকুমেন্ট পাওয়া যায়নি।',
    });
    return;
  }

  emitPrintStatus({
    state: 'loading',
    message: `A4 (মার্জিন: ${marginMm} মিমি) প্রিন্ট PDF প্রস্তুত হচ্ছে...`,
  });

  try {
    const fileSlug = options.filename || `print-a4-${new Date().toISOString().slice(0, 10)}`;
    await exportElementToA4Pdf(targetEl, fileSlug, {
      orientation,
      marginMm,
      fitSinglePage,
    });
    emitPrintStatus({
      state: 'success',
      message: `ডকুমেন্টটি স্বয়ংক্রিয়ভাবে A4 সাইজে (${marginMm} মিমি মার্জিন) প্রিন্ট-রেডি PDF হিসেবে সেভ হয়েছে।`,
    });
  } catch {
    emitPrintStatus({
      state: 'error',
      message:
        'প্রিন্ট ফাইল তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে পেজটি আলাদা ব্রাউজার ট্যাবে খুলে Ctrl+P চাপুন।',
    });
  }
}
