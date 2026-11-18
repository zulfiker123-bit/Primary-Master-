import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseProjectId } from '../firebase';
import { APP_VERSION, checkForAppUpdateNow } from '../utils/appUpdater';
import { toBanglaDigit } from '../utils/bangla';

interface DashboardAuthPanelProps {
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const DashboardAuthPanel: React.FC<DashboardAuthPanelProps> = ({ onOpenAuthModal }) => {
  const {
    user,
    accountMeta,
    authReady,
    syncState,
    lastSyncedAt,
    loginWithIdPassword,
    loginWithGoogle,
    logout,
    emailPasswordDisabledInConsole,
  } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await loginWithIdPassword(loginId, password);
      setLoginId('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'লগিন ব্যর্থ হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      await checkForAppUpdateNow(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const syncLabel =
    syncState === 'syncing'
      ? 'ক্লাউডে সেভ হচ্ছে...'
      : syncState === 'synced'
        ? 'সকল ডিভাইসে সিঙ্কড'
        : syncState === 'offline'
          ? 'অফলাইন (অনলাইনে সিঙ্ক হবে)'
          : syncState === 'error'
            ? 'সিঙ্ক সতর্কতা'
            : 'ক্লাউড সিঙ্ক সক্রিয়';

  if (!authReady) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-4 animate-pulse h-20" />
    );
  }

  if (user) {
    return (
      <section
        aria-label="অ্যাকাউন্ট ও ক্লাউড সিঙ্ক"
        className="rounded-2xl border border-emerald-200/80 bg-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2922] text-emerald-300">
            {syncState === 'offline' ? (
              <CloudOff className="h-5 w-5 text-amber-300" aria-hidden="true" />
            ) : (
              <Cloud className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900 truncate">
                {accountMeta?.displayName || user.displayName || 'শিক্ষক অ্যাকাউন্ট'}
              </p>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>{syncLabel}</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 truncate">
              লগিন আইডি:{' '}
              <span className="font-mono font-semibold text-slate-800">
                {accountMeta?.loginId || user.email || user.uid.slice(0, 10)}
              </span>
              {lastSyncedAt && (
                <span className="text-slate-400 ml-2">
                  · সর্বশেষ সিঙ্ক:{' '}
                  {new Date(lastSyncedAt).toLocaleTimeString('bn-BD', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleCheckUpdate()}
            disabled={checkingUpdate}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-emerald-700 ${checkingUpdate ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>অ্যাপ v{toBanglaDigit(APP_VERSION)} আপডেট</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAuthModal('login')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>অন্য আইডিতে যান</span>
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>লগআউট</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="ড্যাশবোর্ড লগিন প্যানেল"
      className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2922] text-emerald-300">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              আইডি ও পাসওয়ার্ড দিয়ে ড্যাশবোর্ডে লগিন করুন
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              প্রত্যেক শিক্ষকের নিজস্ব আইডি ও পাসওয়ার্ড অনুযায়ী শিক্ষার্থী, মূল্যায়ন, মাসিক FLN ও পাঠ পরিকল্পনা আলাদাভাবে সেভ থাকবে এবং যেকোনো ডিভাইস থেকে চালানো যাবে।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleCheckUpdate()}
            disabled={checkingUpdate}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-emerald-700 ${checkingUpdate ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>অটো-আপডেট v{toBanglaDigit(APP_VERSION)}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAuthModal('register')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>নতুন আইডি খুলুন</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium">{errorMsg}</p>
            {emailPasswordDisabledInConsole && (
              <a
                href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
              >
                <span>Firebase Console-এ Email/Password Enable করুন</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleQuickLogin}
        className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
      >
        <div className="sm:col-span-4">
          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="ইউজার আইডি / মোবাইল / ইমেইল"
            aria-label="ইউজার আইডি বা ইমেইল"
            className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 text-sm text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড"
            aria-label="পাসওয়ার্ড"
            className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/60 pl-3.5 pr-10 text-sm text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="sm:col-span-4 flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F2922] px-4 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{submitting ? 'যাচাই হচ্ছে...' : 'লগিন'}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void loginWithGoogle().catch((e) => setErrorMsg(e.message))}
            title="Google দিয়ে লগিন"
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span>Google</span>
          </button>
        </div>
      </form>
    </section>
  );
};
