import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Package,
} from 'lucide-react';
import { DEFAULT_FEATURE_SETTINGS } from '../data/featureSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { FeatureSettings } from '../types';

function getPublicProductionOrigin(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, host } = window.location;
  // On AI Studio Cloud Run, map dev preview host (ais-dev-*) to public shared production host (ais-pre-*)
  const normalizedHost = host.startsWith('ais-dev-') ? host.replace(/^ais-dev-/, 'ais-pre-') : host;
  return `${protocol}//${normalizedHost}`;
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [featureSettings] = useLocalStorage<FeatureSettings>(
    'app_feature_settings_v1',
    DEFAULT_FEATURE_SETTINGS
  );
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [autoInstallRequested, setAutoInstallRequested] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autoinstall') === '1';
  });

  useEffect(() => {
    if (!autoInstallRequested || !isInstallable || isInstalled) return;
    let cancelled = false;

    const tryAutoInstall = async () => {
      const ok = await install();
      if (!cancelled && ok) {
        setAutoInstallRequested(false);
      }
    };

    void tryAutoInstall();
    return () => {
      cancelled = true;
    };
  }, [autoInstallRequested, isInstallable, isInstalled, install]);

  if (isInstalled) {
    return null;
  }

  const publicOrigin = getPublicProductionOrigin();
  const directInstallUrl = `${publicOrigin}/?autoinstall=1`;
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(publicOrigin)}`;
  const customApkUrl = (featureSettings.apkDownloadUrl || '').trim();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicOrigin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleButtonClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleButtonClick()}
        title="অ্যাপ ডাউনলোড বা ব্রাউজারে ইনস্টল করুন"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          isInstallable
            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-xs'
            : 'bg-white/15 hover:bg-white/25'
        }`}
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isInstallable ? 'ইনস্টল করুন' : 'অ্যাপ ডাউনলোড'}</span>
      </button>

      {/* Auto-install floating bar when opened directly in browser tab with ?autoinstall=1 */}
      {autoInstallRequested && !isInIframe && (
        <div
          role="region"
          aria-label="অ্যাপ ইনস্টল ব্যানার"
          className="fixed bottom-14 md:bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl text-slate-800 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Download className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>অফলাইন অ্যাপ ইনস্টল প্রস্তুত</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoInstallRequested(false)}
              aria-label="বন্ধ করুন"
              className="p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isInstallable
              ? 'নিচের বাটনে চাপলেই আপনার ফোনে অ্যাপটি সরাসরি ইনস্টল হয়ে যাবে।'
              : 'Chrome মেনু (⋮) থেকে "Install app" অথবা "Add to Home screen" চাপুন; অথবা নিচে থেকে APK প্যাকেজ নিন।'}
          </p>
          <div className="flex gap-2">
            {isInstallable ? (
              <button
                type="button"
                onClick={() => void install()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>এখনই ইনস্টল করুন</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAutoInstallRequested(false);
                  setShowGuideModal(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                <span>APK ডাউনলোড বিকল্প</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 text-slate-800 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                id="install-guide-title"
                className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
              >
                <Package className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <span>অ্যাপ ডাউনলোড (.APK) ও ইনস্টল</span>
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

            {/* Option A: Admin Hosted Direct APK Download */}
            {customApkUrl && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2.5">
                <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>সরাসরি Android .APK ফাইল ডাউনলোড করুন</span>
                </p>
                <a
                  href={customApkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>অ্যাপ ফাইল (.APK) ডাউনলোড করুন</span>
                </a>
              </div>
            )}

            {/* Option B: Native Browser 1-Click Install or Public Production Tab */}
            {isInstallable ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  আপনার ব্রাউজারে সরাসরি অফলাইন অ্যাপ ইনস্টল সমর্থিত রয়েছে! নিচের বাটনে চাপলেই ফোনে অ্যাপ আইকন যুক্ত হবে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void install();
                    setShowGuideModal(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>সরাসরি ব্রাউজারে ইনস্টল করুন</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2">
                <p className="text-sm font-bold text-blue-950">iPhone / iPad (Safari) ইনস্টল:</p>
                <ol className="space-y-1.5 text-xs text-blue-900 list-decimal list-inside leading-relaxed">
                  <li>Safari ব্রাউজারে <strong>Share</strong> বাটনে ট্যাপ করুন।</li>
                  <li>নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।</li>
                  <li><strong>Add</strong> চাপুন — সম্পূর্ণ অফলাইনে কাজ করবে।</li>
                </ol>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2.5">
                <p className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                  <span>১. Chrome থেকে সরাসরি ফোনে অ্যাপ ইনস্টল (WebAPK):</span>
                </p>
                <p className="text-xs text-blue-900 leading-relaxed">
                  {isInIframe
                    ? 'প্রিভিউ ফ্রেমের ভেতর থেকে ব্রাউজার ইনস্টল ব্লক থাকে। নিচের বাটনে চেপে মূল লাইভ অ্যাপটি Chrome ট্যাবে খুলুন এবং ⋮ মেনু → "Install app" বা "Add to Home screen" চাপুন:'
                    : 'আপনার ফোনের Chrome ব্রাউজারে ডানদিকের ⋮ মেনু → "Install app" বা "Add to Home screen" চাপলে অ্যাপটি সরাসরি ইনস্টল হয়ে যাবে।'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={directInstallUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowGuideModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>লাইভ অ্যাপ Chrome-এ খুলুন</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{copiedUrl ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Option C: Build & Download Real Android .APK Online via PWABuilder */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>২. ইনস্টলযোগ্য .APK ফাইল তৈরি ও ডাউনলোড (অনলাইন):</span>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                ওয়েব ব্রাউজারের ভেতর Java/Android SDK না থাকায় সরাসরি এখান থেকে বাইনারি{' '}
                <code className="font-mono">.apk</code> কম্পাইল করা যায় না। তবে নিচের বাটনে ক্লিক করে{' '}
                <strong>PWABuilder</strong> থেকে ৩০ সেকেন্ডেই এই অ্যাপের অফিশিয়াল{' '}
                <strong>Android .APK প্যাকেজ</strong> ডাউনলোড করে ফোনে ইনস্টল করতে পারবেন:
              </p>
              <a
                href={pwabuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>PWABuilder থেকে .APK প্যাকেজ ডাউনলোড করুন</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </a>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                টিপস: PWABuilder পেজ খুললে <strong>Package for Stores → Android → Generate Package</strong> ক্লিক করলেই{' '}
                <code className="font-mono">.apk</code> ও Play Store ফাইল ডাউনলোড হবে। অথবা অ্যাডমিন{' '}
                <strong>ড্যাশবোর্ড → ফিচার ও মডিউল</strong>-এ সরাসরি{' '}
                <code className="font-mono">.apk</code> লিংক যুক্ত করলে এখান থেকেই ১-ক্লিক ডাউনলোড করা যাবে।
              </p>
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
