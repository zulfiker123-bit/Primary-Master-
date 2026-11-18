import { useCallback, useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PwaInstallResult = 'accepted' | 'dismissed' | 'unavailable' | 'error';

declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

function detectStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__deferredInstallPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandaloneMode());
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<'idle' | 'installing' | 'accepted' | 'dismissed'>('idle');

  useEffect(() => {
    setIsInstalled(detectStandaloneMode());

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));
    setIsInAppBrowser(
      /(fbav|fban|instagram|line|whatsapp|micromessenger|wv\)|; wv;|gsa\/)/.test(ua)
    );

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt);
    }

    const syncFromWindow = () => {
      if (window.__deferredInstallPrompt) {
        setDeferredPrompt(window.__deferredInstallPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__deferredInstallPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallOutcome('accepted');
    };

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(detectStandaloneMode());
    };

    window.addEventListener('pwa-prompt-ready', syncFromWindow);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);
    standaloneQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('pwa-prompt-ready', syncFromWindow);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(async (): Promise<PwaInstallResult> => {
    const activePrompt = deferredPrompt || window.__deferredInstallPrompt;
    if (!activePrompt) return 'unavailable';

    try {
      setInstallOutcome('installing');
      await activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;

      // BeforeInstallPromptEvent is single-use in Chromium; clear it after prompt completes
      window.__deferredInstallPrompt = null;
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setInstallOutcome('accepted');
        return 'accepted';
      }
      setInstallOutcome('dismissed');
      return 'dismissed';
    } catch {
      window.__deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setInstallOutcome('idle');
      return 'error';
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && window.__deferredInstallPrompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    installOutcome,
    install,
  };
}
