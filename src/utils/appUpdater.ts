import { registerSW } from 'virtual:pwa-register';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.6.0';
export const APP_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';

export type AppUpdateStatus = 'idle' | 'checking' | 'updating' | 'up_to_date';

interface RemoteVersionPayload {
  version?: string;
  buildId?: string;
  builtAt?: string;
}

const RELOAD_GUARD_KEY = 'pm_last_auto_reload_ms';
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // Check every 3 minutes

let swRegistration: ServiceWorkerRegistration | null = null;
let reloadScheduled = false;
let initialized = false;
const listeners = new Set<(status: AppUpdateStatus, message?: string) => void>();

function notify(status: AppUpdateStatus, message?: string) {
  listeners.forEach((cb) => cb(status, message));
}

export function subscribeAppUpdateStatus(
  cb: (status: AppUpdateStatus, message?: string) => void
): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function canSafelyReloadNow(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
    if (Date.now() - last < 15000) {
      return false;
    }
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    return true;
  } catch {
    return !reloadScheduled;
  }
}

async function clearRuntimeCachesAndReload(reason: string) {
  if (reloadScheduled) return;
  if (!canSafelyReloadNow()) return;
  reloadScheduled = true;
  notify('updating', reason);

  try {
    if (swRegistration) {
      await swRegistration.update();
    }
  } catch {
    // ignore SW update error
  }

  try {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    }
  } catch {
    // ignore cache clear error
  }

  window.setTimeout(() => {
    window.location.reload();
  }, 1100);
}

export async function checkForAppUpdateNow(manual = false): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    if (manual) notify('idle');
    return false;
  }

  if (manual) {
    notify('checking', 'নতুন আপডেট যাচাই করা হচ্ছে...');
  }

  let updated = false;

  // 1. Trigger Service Worker update check
  try {
    if (swRegistration) {
      await swRegistration.update();
      if (swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        updated = true;
      }
    }
  } catch {
    // ignore
  }

  // 2. Check /version.json directly with cache-busting (catches WebView & CDN updates too)
  if (import.meta.env.PROD) {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const remote = (await res.json()) as RemoteVersionPayload;
        if (remote?.buildId && remote.buildId !== APP_BUILD_ID) {
          updated = true;
          await clearRuntimeCachesAndReload(
            `নতুন ভার্সন (${remote.version || APP_VERSION}) পাওয়া গেছে — স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে...`
          );
          return true;
        }
      }
    } catch {
      // ignore network errors cleanly when offline
    }
  }

  if (manual && !updated) {
    notify('up_to_date', `আপনি সর্বশেষ ভার্সন (v${APP_VERSION}) ব্যবহার করছেন`);
    window.setTimeout(() => notify('idle'), 3000);
  }

  return updated;
}

export function initAppAutoUpdater(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Listen for Service Worker controller switch -> automatic reload on all devices
  if ('serviceWorker' in navigator) {
    let hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (!reloadScheduled && canSafelyReloadNow()) {
        reloadScheduled = true;
        notify('updating', 'অ্যাপের নতুন আপডেট ইনস্টল হয়েছে — রিলোড হচ্ছে...');
        window.setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      swRegistration = registration;

      // Immediate check on launch
      window.setTimeout(() => {
        void checkForAppUpdateNow(false);
      }, 2500);

      // Periodic check while open
      window.setInterval(() => {
        if (navigator.onLine && document.visibilityState === 'visible') {
          void checkForAppUpdateNow(false);
        }
      }, CHECK_INTERVAL_MS);
    },
    onNeedRefresh() {
      void clearRuntimeCachesAndReload('নতুন আপডেট পাওয়া গেছে — স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে...');
    },
  });

  // Check whenever user returns to app or regains internet
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void checkForAppUpdateNow(false);
    }
  });

  window.addEventListener('online', () => {
    void checkForAppUpdateNow(false);
  });

  // Listen to Firestore release signal (/appMeta/release) for instant cross-device push updates
  try {
    onSnapshot(
      doc(db, 'appMeta', 'release'),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as { buildId?: string; version?: string; forceReload?: boolean };
        if (
          import.meta.env.PROD &&
          data?.buildId &&
          data.buildId !== APP_BUILD_ID &&
          data.forceReload
        ) {
          void clearRuntimeCachesAndReload(
            `নতুন আপডেট (${data.version || APP_VERSION}) প্রকাশিত হয়েছে — আপডেট হচ্ছে...`
          );
        }
      },
      () => {
        // Non-fatal if offline or document not created yet
      }
    );
  } catch {
    // ignore
  }
}
