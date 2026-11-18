import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Printer,
  FileCheck2,
  EyeOff,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { RouteKey } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import { PrintStatusDetail } from '../utils/printHelper';
import {
  DEFAULT_PRINT_PREFERENCES,
  FONT_SIZE_PRESETS,
  MARGIN_PRESETS,
  usePrintPreferences,
} from '../utils/printPreferences';

interface PageShellProps {
  title: string;
  subtitle?: string;
  onNavigate: (route: RouteKey) => void;
  onPrint?: () => void;
  printLabel?: string;
  printReady?: boolean;
  onTogglePrintReady?: () => void;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
  pdfLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  onNavigate,
  onPrint,
  printLabel = 'প্রিন্ট করুন',
  printReady = false,
  onTogglePrintReady,
  onExportPdf,
  exportingPdf = false,
  pdfLabel = 'PDF ডাউনলোড',
  actions,
  children,
}) => {
  const [printStatus, setPrintStatus] = useState<PrintStatusDetail | null>(null);
  const [printPrefs, updatePrintPrefs] = usePrintPreferences();

  const isPresetMargin = MARGIN_PRESETS.some((p) => p.value === printPrefs.marginMm);
  const [customMarginMode, setCustomMarginMode] = useState(!isPresetMargin);
  const isPresetFont =
    printPrefs.fontSizeMode === 'auto' ||
    FONT_SIZE_PRESETS.includes(printPrefs.fontSizePx as (typeof FONT_SIZE_PRESETS)[number]);
  const [customFontInputMode, setCustomFontInputMode] = useState(!isPresetFont);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<PrintStatusDetail>;
      if (custom.detail) {
        setPrintStatus(custom.detail.state === 'idle' ? null : custom.detail);
      }
    };
    window.addEventListener('app-print-status', handler);
    return () => window.removeEventListener('app-print-status', handler);
  }, []);

  const isPrinting = printStatus?.state === 'loading';
  const hasPrintFeatures = Boolean(onPrint || onExportPdf || onTogglePrintReady);
  const isModified =
    printPrefs.marginMm !== DEFAULT_PRINT_PREFERENCES.marginMm ||
    printPrefs.fontSizeMode !== DEFAULT_PRINT_PREFERENCES.fontSizeMode;

  const renderPrintOptionsControls = () => (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-slate-700 shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
        <span>প্রিন্ট ও PDF সেটিংস:</span>
      </div>

      {/* Margin Selector */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="global-print-margin-select" className="text-slate-600 font-medium whitespace-nowrap">
          মার্জিন:
        </label>
        <select
          id="global-print-margin-select"
          value={customMarginMode ? 'custom' : String(printPrefs.marginMm)}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'custom') {
              setCustomMarginMode(true);
            } else {
              setCustomMarginMode(false);
              updatePrintPrefs({ marginMm: Number(val) });
            }
          }}
          className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-700 focus:outline-none"
        >
          {MARGIN_PRESETS.map((m) => (
            <option key={m.value} value={String(m.value)}>
              {m.label}
            </option>
          ))}
          <option value="custom">কাস্টম (মিমি)</option>
        </select>
        {customMarginMode && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={40}
              step={0.5}
              value={printPrefs.marginMm}
              onChange={(e) =>
                updatePrintPrefs({ marginMm: Math.max(0, Math.min(40, Number(e.target.value) || 0)) })
              }
              aria-label="কাস্টম মার্জিন মিলিমিটারে"
              className="w-16 h-9 rounded-xl border border-emerald-300 bg-white px-2 text-center text-xs font-bold tabular-nums focus:border-emerald-700 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">মিমি</span>
          </div>
        )}
      </div>

      {/* Font Size Selector */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="global-print-fontsize-select" className="text-slate-600 font-medium whitespace-nowrap">
          ফন্ট সাইজ:
        </label>
        <select
          id="global-print-fontsize-select"
          value={
            customFontInputMode
              ? 'custom'
              : printPrefs.fontSizeMode === 'auto'
              ? 'auto'
              : String(printPrefs.fontSizePx)
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'auto') {
              setCustomFontInputMode(false);
              updatePrintPrefs({ fontSizeMode: 'auto' });
            } else if (val === 'custom') {
              setCustomFontInputMode(true);
              updatePrintPrefs({ fontSizeMode: 'custom' });
            } else {
              setCustomFontInputMode(false);
              updatePrintPrefs({ fontSizeMode: 'custom', fontSizePx: Number(val) });
            }
          }}
          className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-700 focus:outline-none"
        >
          <option value="auto">অটো (লেখা অনুযায়ী)</option>
          {FONT_SIZE_PRESETS.map((sz) => (
            <option key={sz} value={String(sz)}>
              {toBanglaDigit(sz)} px
            </option>
          ))}
          <option value="custom">কাস্টম (px)</option>
        </select>
        {customFontInputMode && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={9}
              max={28}
              step={0.5}
              value={printPrefs.fontSizePx}
              onChange={(e) =>
                updatePrintPrefs({
                  fontSizeMode: 'custom',
                  fontSizePx: Math.max(9, Math.min(28, Number(e.target.value) || 14)),
                })
              }
              aria-label="কাস্টম ফন্ট সাইজ পিক্সেলে"
              className="w-16 h-9 rounded-xl border border-emerald-300 bg-white px-2 text-center text-xs font-bold tabular-nums focus:border-emerald-700 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">px</span>
          </div>
        )}
      </div>

      {isModified && (
        <button
          type="button"
          onClick={() => {
            setCustomMarginMode(false);
            setCustomFontInputMode(false);
            updatePrintPrefs(DEFAULT_PRINT_PREFERENCES);
          }}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          <span>ডিফল্ট</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      className={
        printReady
          ? 'min-h-screen bg-slate-200/75 px-3 sm:px-6 py-5 sm:py-8'
          : 'mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-20 md:pb-12'
      }
    >
      {printReady ? (
        <div className="no-print mx-auto max-w-5xl mb-4 space-y-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-300 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                A4 প্রিন্ট-রেডি প্রিভিউ (মার্জিন: {toBanglaDigit(printPrefs.marginMm)} মিমি · ফন্ট:{' '}
                {printPrefs.fontSizeMode === 'auto'
                  ? 'অটো'
                  : `${toBanglaDigit(printPrefs.fontSizePx)} px`}
                )
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onTogglePrintReady && (
                <button
                  type="button"
                  onClick={onTogglePrintReady}
                  aria-pressed={printReady}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>এডিটে ফিরুন</span>
                </button>
              )}
              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  {exportingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : pdfLabel}</span>
                </button>
              )}
              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  disabled={isPrinting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  {isPrinting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{isPrinting ? 'প্রস্তুত হচ্ছে...' : printLabel}</span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-2.5">
            {renderPrintOptionsControls()}
          </div>
        </div>
      ) : (
        <>
          <div className="no-print mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white border border-slate-200/90 p-4 sm:px-6 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>হোমে ফিরুন</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>}
              </div>
            </div>

            {(actions || hasPrintFeatures) && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {actions}
                {onTogglePrintReady && (
                  <button
                    type="button"
                    onClick={onTogglePrintReady}
                    aria-pressed={printReady}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileCheck2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    <span>Print-ready (A4)</span>
                  </button>
                )}
                {onExportPdf && (
                  <button
                    type="button"
                    onClick={onExportPdf}
                    disabled={exportingPdf}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    {exportingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : pdfLabel}</span>
                  </button>
                )}
                {onPrint && (
                  <button
                    type="button"
                    onClick={onPrint}
                    disabled={isPrinting}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    {isPrinting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Printer className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{isPrinting ? 'প্রস্তুত হচ্ছে...' : printLabel}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {hasPrintFeatures && (
            <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white border border-slate-200/90 px-4 py-2.5 shadow-2xs">
              {renderPrintOptionsControls()}
              <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                বর্তমান সেটিংস: মার্জিন {toBanglaDigit(printPrefs.marginMm)} মিমি · ফন্ট{' '}
                {printPrefs.fontSizeMode === 'auto'
                  ? 'অটো'
                  : `${toBanglaDigit(printPrefs.fontSizePx)} px`}
              </span>
            </div>
          )}
        </>
      )}

      {printStatus && (
        <div
          role="status"
          className={`no-print mb-4 mx-auto ${
            printReady ? 'max-w-5xl' : ''
          } flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm ${
            printStatus.state === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : printStatus.state === 'loading'
              ? 'border-blue-200 bg-blue-50 text-blue-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {printStatus.state === 'loading' ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" aria-hidden="true" />
            ) : printStatus.state === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            )}
            <span>{printStatus.message}</span>
          </div>
          {printStatus.state !== 'loading' && (
            <button
              type="button"
              onClick={() => setPrintStatus(null)}
              aria-label="বার্তা বন্ধ করুন"
              className="p-1 opacity-70 hover:opacity-100 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
