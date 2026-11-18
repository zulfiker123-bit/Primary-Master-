import React from 'react';
import { Bell, BookOpen, Home, ClipboardList, FileSignature, Compass, UserCheck } from 'lucide-react';
import { RouteKey } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import { PWAInstallButton } from './PWAInstallButton';
import { DPE_LOGO_SRC } from './OfficialEmblems';

interface HeaderProps {
  currentRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  onPrefetch: (route: RouteKey) => void;
  unreadNotices: number;
  onOpenProfile: () => void;
}

const NAV_LINKS: { route: RouteKey; label: string }[] = [
  { route: 'home', label: 'ড্যাশবোর্ড' },
  { route: 'lesson_plan', label: 'পাঠ পরিকল্পনা' },
  { route: 'suggestions', label: 'প্রশ্ন ও সাজেশন' },
  { route: 'monthly_fln', label: 'মাসিক FLN' },
  { route: 'portals', label: 'পোর্টাল' },
];

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  onPrefetch,
  unreadNotices,
  onOpenProfile,
}) => {
  return (
    <>
      <header className="no-print sticky top-0 z-40 h-14 md:h-16 bg-[#0F2922] text-white border-b border-emerald-950/60">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 sm:gap-4 md:gap-8 px-3 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex min-w-0 items-center gap-2 sm:gap-2.5 text-left font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-lg py-1"
          >
            <img
              src={DPE_LOGO_SRC}
              alt="প্রাইমারি মাস্টার"
              className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-xl object-contain ring-1 ring-amber-300/60 shrink-0 bg-white p-0.5"
            />
            <span className="truncate text-sm sm:text-base md:text-lg font-display">প্রাইমারি মাস্টার</span>
          </button>

          {/* Zone 2: 5 concise single-line nav links (desktop) */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-emerald-100/85"
            aria-label="প্রধান নেভিগেশন"
          >
            {NAV_LINKS.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  onMouseEnter={() => onPrefetch(item.route)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded ${
                    active ? 'text-white font-semibold' : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Action triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              onMouseEnter={() => onPrefetch('notices')}
              aria-label="লাইভ নোটিশ"
              title="লাইভ নোটিশ"
              className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-emerald-100 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <Bell className="h-5 w-5" />
              {unreadNotices > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950 tabular-nums ring-2 ring-[#0F2922]">
                  {toBanglaDigit(unreadNotices)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />
              <span>শিক্ষক প্রোফাইল</span>
            </button>
          </div>
        </div>
      </header>

      {/* Compact mobile thumb-zone bottom bar (48px) */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 h-12 bg-white/95 backdrop-blur-md border-t border-stone-200 grid grid-cols-5 items-center px-1"
      >
        {[
          { route: 'home' as RouteKey, label: 'ড্যাশবোর্ড', icon: Home },
          { route: 'lesson_plan' as RouteKey, label: 'পাঠ', icon: BookOpen },
          { route: 'monthly_fln' as RouteKey, label: 'মাসিক FLN', icon: ClipboardList },
          { route: 'applications' as RouteKey, label: 'আবেদন', icon: FileSignature },
          { route: 'portals' as RouteKey, label: 'পোর্টাল', icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = currentRoute === tab.route;
          return (
            <button
              key={tab.route}
              type="button"
              onClick={() => onNavigate(tab.route)}
              onTouchStart={() => onPrefetch(tab.route)}
              className={`flex flex-col items-center justify-center h-full text-[10px] font-medium transition-colors whitespace-nowrap ${
                active ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
