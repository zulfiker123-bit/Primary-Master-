import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppUpdateStatus, subscribeAppUpdateStatus } from '../utils/appUpdater';

export const UpdateBanner: React.FC = () => {
  const [status, setStatus] = useState<AppUpdateStatus>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    return subscribeAppUpdateStatus((nextStatus, nextMsg) => {
      setStatus(nextStatus);
      setMessage(nextMsg || '');
    });
  }, []);

  if (status === 'idle') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print fixed top-16 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-lg transition-all ${
        status === 'up_to_date'
          ? 'bg-emerald-700 text-white'
          : 'bg-[#0F2922] text-emerald-50 ring-1 ring-emerald-400/50'
      }`}
    >
      {status === 'up_to_date' ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-4 w-4 animate-spin text-emerald-300 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
};
