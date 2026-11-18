import React, { useState } from 'react';
import { Globe, Code2, TrendingUp, Send, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { RouteKey } from '../types';
import studioImg from '../assets/images/digital_studio_desk_1794703906737.jpg';

interface PortfolioPageProps {
  onNavigate: (route: RouteKey) => void;
}

export default function PortfolioPage({ onNavigate }: PortfolioPageProps) {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [sent, setSent] = useState(false);
  const [msgForm, setMsgForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setMsgForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <PageShell
      title={lang === 'bn' ? 'শিক্ষক ও ডেভেলপার পরিচিতি — জুলফিকার রহমান' : 'Profile — Zulfikar Rahman'}
      subtitle="Assistant Teacher · 82 No. Kola Govt. Primary School, Assasuni, Satkhira"
      onNavigate={onNavigate}
      actions={
        <button
          type="button"
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
        >
          <Globe className="h-4 w-4 text-blue-600" />
          <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-center space-y-4">
            <p className="text-xs font-semibold text-blue-700">
              {lang === 'bn'
                ? '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয় · আশাশুনি, সাতক্ষীরা'
                : '82 No. Kola Govt. Primary School · Assasuni, Satkhira'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {lang === 'bn' ? 'জুলফিকার রহমান' : 'Zulfikar Rahman'}
            </h2>
            <p className="text-sm font-medium text-slate-600">
              {lang === 'bn'
                ? 'সহকারী শিক্ষক, ৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়, আশাশুনি, সাতক্ষীরা।'
                : 'Assistant Teacher, 82 No. Kola Govt. Primary School, Assasuni, Satkhira.'}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {lang === 'bn'
                ? 'শিক্ষাব্যবস্থাকে ডিজিটাল ও সহজতর করার লক্ষ্যে এবং প্রাথমিক বিদ্যালয়ের শিক্ষকদের দৈনন্দিন পাঠ পরিকল্পনা, মাসিক FLN যাচাই, মূল্যায়ন রেকর্ড ও দাপ্তরিক কাজ দ্রুত সম্পন্ন করতে "প্রাইমারি মাস্টার" প্ল্যাটফর্মটি সাজানো হয়েছে, যাতে শিক্ষকগণ শ্রেণিকক্ষের পাঠদানে আরও বেশি মনোযোগ দিতে পারেন।'
                : 'Dedicated to modernizing primary education and empowering teachers with offline-first digital tools for annual lesson plans, monthly FLN competency tracking, student evaluation records, and school administration.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-600" />
                {lang === 'bn'
                  ? 'কোলা, মাড়িয়ালা, আশাশুনি, সাতক্ষীরা'
                  : 'Kola, Mariala, Assasuni, Satkhira'}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Phone className="h-4 w-4 text-blue-600" />
                {lang === 'bn' ? '০১৭৬৭৭৯২২৪৯' : '01767792249'}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[240px]">
            <img
              src={studioImg}
              alt="Primary Teacher Digital Workspace"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        {/* Core Services */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Code2,
              title: lang === 'bn' ? 'ওয়েব ও অ্যাপ ডেভেলপমেন্ট' : 'Web & App Development',
              desc:
                lang === 'bn'
                  ? 'দ্রুতগতির রেসপন্সিভ ওয়ার্ডপ্রেস ও কাস্টম ওয়েব অ্যাপ্লিকেশন, স্কুল ম্যানেজমেন্ট সিস্টেম ও PWA তৈরি।'
                  : 'Fast responsive WordPress websites, custom school management web apps, and mobile-ready PWAs.',
            },
            {
              icon: TrendingUp,
              title: lang === 'bn' ? 'ডিজিটাল মার্কেটিং ও SEO' : 'Digital Marketing & SEO',
              desc:
                lang === 'bn'
                  ? 'গুগল সার্চ অপ্টিমাইজেশন, সোশ্যাল মিডিয়া ক্যাম্পেইন ও ব্র্যান্ড গ্রোথ স্ট্র্যাটেজি।'
                  : 'Search engine optimization, conversion-focused ad campaigns, and brand growth strategies.',
            },
            {
              icon: Mail,
              title: lang === 'bn' ? 'শিক্ষকদের আইসিটি ও ফ্রিল্যান্সিং' : 'Educator ICT & Freelancing',
              desc:
                lang === 'bn'
                  ? 'শিক্ষকদের জন্য ডিজিটাল দক্ষতা উন্নয়ন ও পার্ট-টাইম ফ্রিল্যান্সিং গাইডলাইন।'
                  : 'Practical ICT training and part-time freelancing mentorship tailored for educators.',
            },
          ].map((srv) => {
            const Icon = srv.icon;
            return (
              <div key={srv.title} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{srv.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{srv.desc}</p>
              </div>
            );
          })}
        </section>

        {/* Contact Form */}
        <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {lang === 'bn' ? 'প্রজেক্ট বা পরামর্শের জন্য যোগাযোগ করুন' : 'Get in Touch for Projects'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {lang === 'bn'
              ? 'কাস্টম স্কুল ওয়েবসাইট বা ডিজিটাল সেবার জন্য বার্তা পাঠান।'
              : 'Send a message for custom school portals, WordPress builds, or digital consulting.'}
          </p>

          {sent ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-2.5 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'ধন্যবাদ! আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে।'
                  : 'Thank you! Your message has been received.'}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your Name'}
                  value={msgForm.name}
                  onChange={(e) => setMsgForm({ ...msgForm, name: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
                <input
                  type="email"
                  required
                  placeholder={lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
                  value={msgForm.email}
                  onChange={(e) => setMsgForm({ ...msgForm, email: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder={lang === 'bn' ? 'আপনার বার্তা লিখুন...' : 'Write your message...'}
                value={msgForm.message}
                onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                <span>{lang === 'bn' ? 'বার্তা পাঠান' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </section>
      </div>
    </PageShell>
  );
}
