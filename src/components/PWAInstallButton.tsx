import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Package,
  MoreVertical,
} from 'lucide-react';
import { DEFAULT_FEATURE_SETTINGS } from '../data/featureSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { FeatureSettings } from '../types';

function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function getPublicShareOrigin(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, host } = window.location;
  const normalizedHost = host.startsWith('ais-dev-') ? host.replace(/^ais-dev-/, 'ais-pre-') : host;
  return `${protocol}//${normalizedHost}`;
}

export const PWAInstallButton: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    install,
  } = usePWAInstall();
  const [featureSettings] = useLocalStorage<FeatureSettings>(
    'app_feature_settings_v1',
    DEFAULT_FEATURE_SETTINGS
  );
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showApkTools, setShowApkTools] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [autoInstallBannerDismissed, setAutoInstallBannerDismissed] = useState(false);
  const [autoInstallRequested] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autoinstall') === '1';
  });

  if (isInstalled) {
    return null;
  }

  const currentOrigin = getCurrentOrigin();
  const publicOrigin = getPublicShareOrigin();
  const directChromeUrl = `${currentOrigin}/?autoinstall=1`;
  const androidChromeIntentUrl =
    typeof window !== 'undefined'
      ? `intent://${window.location.host}/?autoinstall=1#Intent;scheme=https;package=com.android.chrome;end`
      : directChromeUrl;
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(publicOrigin)}`;
  const customApkUrl = (featureSettings.apkDownloadUrl || '').trim();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentOrigin || publicOrigin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleButtonClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted' || outcome === 'dismissed') {
        return;
      }
    }
    setShowGuideModal(true);
  };

  const showFloatingPromptBar =
    !isInIframe && !autoInstallBannerDismissed && (autoInstallRequested || isInstallable);

  return (
    <>
      <button
        type="button"
        onClick={() => void handleButtonClick()}
        title="অ্যাপ ফোনে ইনস্টল করুন"
        aria-label="অ্যাপ ইনস্টল করুন"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          isInstallable
            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-xs'
            : 'bg-emerald-600/90 hover:bg-emerald-500 ring-1 ring-emerald-300/40'
        }`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>অ্যাপ ইনস্টল করুন</span>
      </button>

      {/* Clean Android/Browser Install Bar when opened directly (?autoinstall=1 or prompt ready) */}
      {showFloatingPromptBar && isInstallable && (
        <div
          role="region"
          aria-label="অ্যাপ ইনস্টল ব্যানার"
          className="no-print fixed bottom-14 md:bottom-4 right-3 left-3 sm:left-auto sm:max-w-sm z-40 rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-xl text-slate-800 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>ফোনে অ্যাপ ইনস্টল করুন</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoInstallBannerDismissed(true)}
              aria-label="বন্ধ করুন"
              className="p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            নিচের বাটনে চাপলেই আপনার Android ফোনে &ldquo;প্রাইমারি মাস্টার&rdquo; সরাসরি অ্যাপ হিসেবে ইনস্টল হয়ে যাবে।
          </p>
          <button
            type="button"
            onClick={() => void handleButtonClick()}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>এখনই ইনস্টল করুন</span>
          </button>
        </div>
      )}

      {showGuideModal && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 text-slate-800 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                id="install-guide-title"
                className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
              >
                <Smartphone className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <span>অ্যাপ ইনস্টল করুন (Android / মোবাইল)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="বন্ধ করুন"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isInstallable ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  আপনার ফোনে সরাসরি অ্যাপ ইনস্টল করার জন্য প্রস্তুত! নিচের বাটনে চাপলেই হোম স্ক্রিনে অ্যাপ আইকন যুক্ত হবে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void install();
                    setShowGuideModal(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>সরাসরি ইনস্টল করুন</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2">
                <p className="text-sm font-bold text-blue-950">iPhone / iPad (Safari) ইনস্টল:</p>
                <ol className="space-y-1.5 text-xs text-blue-900 list-decimal list-inside leading-relaxed">
                  <li>Safari ব্রাউজারের নিচের <strong>Share</strong> আইকনে ট্যাপ করুন।</li>
                  <li>নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।</li>
                  <li>উপরের <strong>Add</strong> চাপুন — সম্পূর্ণ অফলাইনে চলবে।</li>
                </ol>
              </div>
            ) : isInIframe ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3">
                <p className="text-sm font-bold text-emerald-950">
                  সরাসরি Chrome-এ খুলে Android ফোনে ইনস্টল করুন:
                </p>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  প্রিভিউ ফ্রেমের ভেতর থেকে ব্রাউজার নিরাপত্তা কারণে সরাসরি ইনস্টল আটকে রাখে। নিচের বাটনে চাপলে মূল অ্যাপটি নতুন Chrome ট্যাবে খুলবে এবং সেখান থেকে এক ট্যাপেই ফোনে ইনস্টল হবে:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={directChromeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowGuideModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span>Chrome-এ খুলে ইনস্টল করুন</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{copiedUrl ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <MoreVertical className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>Android Chrome থেকে ১-ট্যাপে ইনস্টল পদ্ধতি:</span>
                </p>

                {isAndroid && isInAppBrowser ? (
                  <>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      আপনি বর্তমানে ইন-অ্যাপ ব্রাউজার (যেমন: WhatsApp / Facebook) থেকে দেখছেন। ফোনে অ্যাপ ইনস্টল করতে নিচের বাটনে চেপে <strong>Google Chrome</strong>-এ খুলুন:
                    </p>
                    <a
                      href={androidChromeIntentUrl}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      <span>Google Chrome-এ খুলুন</span>
                    </a>
                  </>
                ) : (
                  <ol className="space-y-1.5 text-xs text-emerald-950 list-decimal list-inside leading-relaxed">
                    <li>
                      Chrome ব্রাউজারের উপরের ডান কোণায় <strong>⋮ (তিন ডট)</strong> মেনুতে ট্যাপ করুন।
                    </li>
                    <li>
                      তালিকা থেকে <strong>Install app</strong> অথবা <strong>Add to Home screen</strong> নির্বাচন করুন।
                    </li>
                    <li>
                      <strong>Install</strong> চাপুন — ফোনের হোম স্ক্রিন ও অ্যাপ ড্রয়ারে &ldquo;প্রাইমারি মাস্টার&rdquo; যোগ হয়ে যাবে।
                    </li>
                  </ol>
                )}

                {isAndroid && !isInAppBrowser && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{copiedUrl ? 'লিংক কপি হয়েছে' : 'অ্যাপ লিংক কপি'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin Hosted Direct APK Download if configured */}
            {customApkUrl && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                <p className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  <span>সরাসরি .APK ফাইল ডাউনলোড</span>
                </p>
                <a
                  href={customApkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>অ্যাপ ফাইল (.APK) ডাউনলোড করুন</span>
                </a>
              </div>
            )}

            {/* Secondary collapsible PWABuilder / APK Package generator */}
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => setShowApkTools((v) => !v)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>{showApkTools ? 'বিকল্প .APK প্যাকেজ লুকান' : 'অ্যাডভান্সড: আলাদা .APK ফাইল তৈরি করুন'}</span>
              </button>

              {showApkTools && (
                <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Play Store বা সরাসরি শেয়ার করার জন্য আলাদা <code className="font-mono">.apk</code> প্যাকেজ তৈরি করতে চাইলে PWABuilder ব্যবহার করতে পারেন:
                  </p>
                  <a
                    href={pwabuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>PWABuilder থেকে .APK তৈরি করুন</span>
                    <ExternalLink className="h-3 w-3 opacity-80" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </>
  );
};
