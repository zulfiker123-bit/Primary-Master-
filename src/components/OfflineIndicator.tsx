import React from 'react';
import { WifiOff, HardDrive } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-14 md:bottom-4 left-4 right-4 sm:right-auto z-40 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg ring-1 ring-amber-400/50"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>অফলাইন মোড — ফোনের ডিফল্ট স্টোরেজ থেকে সম্পূর্ণ কাজ করছে</span>
      <HardDrive className="h-3.5 w-3.5 shrink-0 opacity-85 hidden sm:inline" aria-hidden="true" />
    </div>
  );
};
