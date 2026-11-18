import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { RouteKey } from '../types';

interface InfoPagesProps {
  route: Extract<
    RouteKey,
    'about' | 'contact' | 'privacy_policy' | 'terms' | 'return_refund' | 'delivery_policy' | 'pricing'
  >;
  onNavigate: (route: RouteKey) => void;
}

const INFO_CONTENT: Record<
  InfoPagesProps['route'],
  { title: string; subtitle: string; paragraphs: string[] }
> = {
  about: {
    title: 'আমাদের সম্পর্কে (About Us)',
    subtitle: 'প্রাইমারি মাস্টার ও বিদ্যালয় ডিজিটাল ব্যবস্থাপনার লক্ষ্য ও উদ্দেশ্য',
    paragraphs: [
      'প্রাইমারি মাস্টার (Primary Master) বাংলাদেশের প্রাথমিক বিদ্যালয়ের শিক্ষকবৃন্দের দৈনন্দিন দাপ্তরিক ও একাডেমিক কাজকে সহজ, নির্ভুল ও সময়সাশ্রয়ী করার একটি সমন্বিত ডিজিটাল প্ল্যাটফর্ম।',
      'এখানে প্রাক-প্রাথমিক থেকে ৫ম শ্রেণির বার্ষিক পাঠ পরিকল্পনা, অধ্যায়ভিত্তিক প্রশ্ন-উত্তর, কাস্টম প্রশ্নপত্র তৈরি, মাসিক FLN যাচাই (১২ মাস), নৈমিত্তিক ছুটির আবেদন, মূল্যায়ন রেজিস্টার এবং প্রশংসাপত্র/ছাড়পত্র তৈরির সুবিধা একত্রিত করা হয়েছে।',
      'ডিফল্ট পরিচিতি: জুলফিকার রহমান, সহকারী শিক্ষক, ৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়, আশাশুনি, সাতক্ষীরা।',
    ],
  },
  contact: {
    title: 'যোগাযোগ (Contact Us)',
    subtitle: 'যেকোনো প্রশ্ন, কারিগরি সহায়তা বা পরামর্শের জন্য যোগাযোগ করুন',
    paragraphs: [
      'নাম: জুলফিকার রহমান (সহকারী শিক্ষক)',
      'বিদ্যালয়: ৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়',
      'ঠিকানা: কোলা, মাড়িয়ালা, আশাশুনি, সাতক্ষীরা, বাংলাদেশ।',
      'মোবাইল: ০১৭৬৭৭৯২২৪৯',
    ],
  },
  privacy_policy: {
    title: 'গোপনীয়তা নীতি (Privacy Policy)',
    subtitle: 'আপনার এবং আপনার বিদ্যালয়ের তথ্যের সুরক্ষা',
    paragraphs: [
      'শিক্ষকের প্রোফাইল, শিক্ষার্থীর তথ্য, মাসিক FLN রেকর্ড এবং মূল্যায়ন রেকর্ড সম্পূর্ণভাবে আপনার নিজস্ব ডিভাইসের ব্রাউজারে (Local Storage) সংরক্ষিত থাকে।',
      'আমরা ব্যবহারকারীর কোনো ব্যক্তিগত ডেটা তৃতীয় পক্ষের সাথে বিক্রয় বা বিনিময় করি না। আপনি চাইলে যেকোনো সময় JSON ব্যাকআপ ডাউনলোড করে নিজের কাছে সংরক্ষণ করতে পারেন।',
    ],
  },
  terms: {
    title: 'ব্যবহারের শর্তাবলি (Terms of Service)',
    subtitle: 'প্রাইমারি মাস্টার ব্যবহারের সাধারণ নির্দেশনা',
    paragraphs: [
      'অ্যাপের সকল পাঠ পরিকল্পনা, ফরম ও টেমপ্লেট প্রাথমিক বিদ্যালয়ের শিক্ষকদের সহায়তার জন্য উন্মুক্ত করা হয়েছে।',
      'শিক্ষক ফোরামে কোনো ধরনের অশ্লীল, বিভ্রান্তিকর বা স্প্যাম বার্তা পোস্ট করা থেকে বিরত থাকার অনুরোধ করা হচ্ছে।',
    ],
  },
  return_refund: {
    title: 'রিটার্ন ও রিফান্ড নীতি (Return & Refund Policy)',
    subtitle: 'ডিজিটাল সেবা ও কাস্টম প্যাকেজ সংক্রান্ত নীতিমালা',
    paragraphs: [
      'প্রাইমারি মাস্টার মূল ওয়েব অ্যাপ্লিকেশন শিক্ষকদের জন্য বিনামূল্যে ব্যবহারযোগ্য।',
      'কাস্টম বিদ্যালয় প্যাকেজ বা প্রিমিয়াম ওয়েব সার্ভিসের ক্ষেত্রে সেবা প্রদানের পূর্বে শর্তাবলি আলোচনা সাপেক্ষে নির্ধারিত হয় এবং কারিগরি ত্রুটি সমাধানযোগ্য না হলে ৭ কর্মদিবসের মধ্যে সমন্বয় করা হয়।',
    ],
  },
  delivery_policy: {
    title: 'ডেলিভারি নীতি (Delivery Policy)',
    subtitle: 'ডিজিটাল অ্যাক্সেস ও কাস্টম সফটওয়্যার ডেলিভারি',
    paragraphs: [
      'এটি একটি সম্পূর্ণ অনলাইন ও PWA-সমর্থিত ডিজিটাল প্ল্যাটফর্ম, তাই রেজিস্ট্রেশন বা ভিজিটের সাথে সাথেই তাৎক্ষণিক অ্যাক্সেস পাওয়া যায়।',
      'কোনো বিদ্যালয়ের জন্য কাস্টম ব্র্যান্ডিং ও ডোমেইন সেটআপ করা হলে ৩ থেকে ৫ কর্মদিবসের মধ্যে ডেলিভারি সম্পন্ন করা হয়।',
    ],
  },
  pricing: {
    title: 'সেবা ও মূল্য তালিকা (Pricing)',
    subtitle: 'ব্যক্তিগত শিক্ষক ও বিদ্যালয়ের জন্য সাশ্রয়ী প্যাকেজ',
    paragraphs: [
      'সাধারণ শিক্ষক ব্যবহার (ফ্রি): পাঠ পরিকল্পনা, প্রশ্ন-উত্তর, আবেদন ফরম, মূল্যায়ন রেকর্ড, মাসিক FLN যাচাই, সনদপত্র ও শিক্ষক ফোরাম — সম্পূর্ণ ফ্রি।',
      'কাস্টম বিদ্যালয় পোর্টাল ও ডোমেইন প্যাকেজ: নিজস্ব বিদ্যালয়ের নামে ডোমেইন, কাস্টম লোগো ও ডেডিকেটেড সাপোর্ট প্যাকেজ — ১০,০০০ টাকা (এককালীন সেটআপ)।',
    ],
  },
};

export default function InfoPages({ route, onNavigate }: InfoPagesProps) {
  const content = INFO_CONTENT[route];
  const [sent, setSent] = useState(false);

  return (
    <PageShell title={content.title} subtitle={content.subtitle} onNavigate={onNavigate}>
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 max-w-3xl space-y-4">
        {content.paragraphs.map((p, i) => (
          <p key={i} className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {p}
          </p>
        ))}

        {route === 'contact' && (
          <div className="pt-4 border-t border-slate-100">
            {sent ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>আপনার বার্তা পাঠানো হয়েছে। শীঘ্রই যোগাযোগ করা হবে।</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-3 max-w-md"
              >
                <input
                  type="text"
                  required
                  placeholder="আপনার নাম"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
                <input
                  type="tel"
                  required
                  placeholder="মোবাইল নম্বর"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="আপনার প্রশ্ন বা মতামত লিখুন..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  <span>বার্তা পাঠান</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
