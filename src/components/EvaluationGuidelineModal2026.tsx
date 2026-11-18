import React from 'react';
import { BookOpenCheck, CheckCircle2, Info, X } from 'lucide-react';
import { getEvaluationSchemasForClass } from '../data/evaluationSchema2026';
import { toBanglaDigit } from '../utils/bangla';

interface EvaluationGuidelineModal2026Props {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
}

export const EvaluationGuidelineModal2026: React.FC<EvaluationGuidelineModal2026Props> = ({
  isOpen,
  onClose,
  selectedClass,
}) => {
  if (!isOpen) return null;

  const class12Schemas = getEvaluationSchemasForClass('প্রথম শ্রেণি');
  const class35Schemas = getEvaluationSchemasForClass('পঞ্চম শ্রেণি');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) — ২০২৬ নির্দেশিকা
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-emerald-800" />
              <span>প্রাথমিক স্তরের বিষয়ভিত্তিক নম্বর বণ্টন, পাস নিয়ম ও গ্রেডেশন</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Class 1-2 vs Class 3-5 Marks Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-950">
                ১ম ও ২য় শ্রেণি (মোট ৭টি বিষয় — ৫০০ নম্বর)
              </h4>
              {(selectedClass === 'প্রথম শ্রেণি' || selectedClass === 'দ্বিতীয় শ্রেণি') && (
                <span className="rounded-md bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-white">
                  নির্বাচিত
                </span>
              )}
            </div>
            <table className="w-full border-collapse border border-slate-300 bg-white text-xs tabular-nums">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="border border-slate-300 p-1.5 text-left">বিষয়</th>
                  <th className="border border-slate-300 p-1.5">ধারাবাহিক</th>
                  <th className="border border-slate-300 p-1.5">সামষ্টিক</th>
                  <th className="border border-slate-300 p-1.5">পূর্ণমান</th>
                </tr>
              </thead>
              <tbody>
                {class12Schemas.map((s) => (
                  <tr key={s.id}>
                    <td className="border border-slate-300 p-1.5 font-medium">
                      {s.name}
                      {s.resourceType === 'tg_only' && (
                        <span className="block text-[10px] text-slate-500">শুধুমাত্র শিক্ষক সহায়িকা</span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {toBanglaDigit(s.caMax)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {s.saMax > 0 ? `${toBanglaDigit(s.saMax)} (${s.examDuration})` : '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">
                      {toBanglaDigit(s.fullMarks)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-100/80 font-bold text-emerald-950">
                  <td className="border border-slate-300 p-1.5">সর্বমোট</td>
                  <td className="border border-slate-300 p-1.5 text-center">৩৫০</td>
                  <td className="border border-slate-300 p-1.5 text-center">১৫০</td>
                  <td className="border border-slate-300 p-1.5 text-center">৫০০</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                ৩য়, ৪র্থ ও ৫ম শ্রেণি (মোট ৮টি বিষয় — ৭০০ নম্বর)
              </h4>
              {(selectedClass === 'তৃতীয় শ্রেণি' ||
                selectedClass === 'চতুর্থ শ্রেণি' ||
                selectedClass === 'পঞ্চম শ্রেণি') && (
                <span className="rounded-md bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-white">
                  নির্বাচিত
                </span>
              )}
            </div>
            <table className="w-full border-collapse border border-slate-300 bg-white text-xs tabular-nums">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="border border-slate-300 p-1.5 text-left">বিষয়</th>
                  <th className="border border-slate-300 p-1.5">ধারাবাহিক</th>
                  <th className="border border-slate-300 p-1.5">সামষ্টিক</th>
                  <th className="border border-slate-300 p-1.5">পূর্ণমান</th>
                </tr>
              </thead>
              <tbody>
                {class35Schemas.map((s) => (
                  <tr key={s.id}>
                    <td className="border border-slate-300 p-1.5 font-medium">
                      {s.name}
                      {s.resourceType === 'tg_only' && (
                        <span className="block text-[10px] text-slate-500">শুধুমাত্র শিক্ষক সহায়িকা</span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {toBanglaDigit(s.caMax)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {s.saMax > 0 ? `${toBanglaDigit(s.saMax)} (${s.examDuration})` : '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">
                      {toBanglaDigit(s.fullMarks)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-100/80 font-bold text-emerald-950">
                  <td className="border border-slate-300 p-1.5">সর্বমোট</td>
                  <td className="border border-slate-300 p-1.5 text-center">২৮০</td>
                  <td className="border border-slate-300 p-1.5 text-center">৪২০</td>
                  <td className="border border-slate-300 p-1.5 text-center">৭০০</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4-part Continuous Assessment Breakdown */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
          <h4 className="text-sm font-bold text-slate-900">
            ধারাবাহিক মূল্যায়নের ৪টি ক্ষেত্র ও নম্বর বিভাজন (সেকশন ২.৩)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="font-bold text-slate-900">১.১ পাঠ্যপুস্তক / টিজি কাজ</p>
              <p className="text-slate-600 mt-1">১ম–২য় ও ৫০ নম্বরের বিষয়: <strong>২০</strong></p>
              <p className="text-slate-600">৩য়–৫ম (১০০ নম্বরের বিষয়): <strong>১০</strong></p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="font-bold text-slate-900">১.২ শ্রেণিকাজে সক্রিয়তা</p>
              <p className="text-slate-600 mt-1">সকল শ্রেণি ও সকল বিষয়: <strong>৫</strong></p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="font-bold text-slate-900">১.৩ ভাষাদক্ষতা / বোধগম্যতা</p>
              <p className="text-slate-600 mt-1">সকল শ্রেণি ও সকল বিষয়: <strong>৫</strong></p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
              <p className="font-bold text-slate-900">১.৪ ক্লাস টেস্ট</p>
              <p className="text-slate-600 mt-1">১ম–২য় ও ৫০ নম্বরের বিষয়: <strong>২০</strong></p>
              <p className="text-slate-600">৩য়–৫ম (১০০ নম্বরের বিষয়): <strong>১০</strong></p>
            </div>
          </div>
        </div>

        {/* Pass rules + Grading Scales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-1.5">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-amber-700" />
              <span>পরবর্তী শ্রেণিতে উত্তীর্ণের শর্তাবলি (সেকশন ৩)</span>
            </h4>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              <li>প্রতি প্রান্তিকে ন্যূনতম <strong>৮৫% উপস্থিতি</strong> থাকা আবশ্যক।</li>
              <li>প্রতি বিষয়ে পাস নম্বর ন্যূনতম <strong>৪০%</strong> (৪০/১০০ অথবা ২০/৫০)।</li>
              <li>
                <strong>বিশেষ চাহিদাসম্পন্ন শিক্ষার্থী:</strong> বিষয়ভিত্তিক পাস নম্বর <strong>৩৩%</strong> (৩৩/১০০ অথবা ১৭/৫০)।
              </li>
              <li>৩টি প্রান্তিকের গড় ফলাফল ন্যূনতম ৪০% হলে বার্ষিক উত্তীর্ণ; তবে ফেলকৃত বিষয় থাকলেও শিক্ষক প্রয়োজনে <strong>শর্তসাপেক্ষ প্রমোট</strong> করতে পারবেন।</li>
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <span>গ্রেডেশন পদ্ধতি (NCTB ২০২৬ ও GPA ৫.০০)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white border border-slate-200 p-2">
                <p className="font-bold text-emerald-900 mb-1">NCTB ২০২৬ প্রাথমিক গ্রেড</p>
                <p>৮০% – ১০০%: <strong>A</strong> (অতি উত্তম)</p>
                <p>৬০% – ৭৯%: <strong>B</strong> (উত্তম)</p>
                <p>৪০% – ৫৯%: <strong>C</strong> (সন্তোষজনক)</p>
                <p>০% – ৩৯%: <strong>D</strong> (সহায়তা প্রয়োজন)</p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2">
                <p className="font-bold text-slate-900 mb-1">GPA স্কেল (৫.০০)</p>
                <p>৮০+: A+ (৫.০০) · ৭০+: A (৪.০০)</p>
                <p>৬০+: A- (৩.৫০) · ৫০+: B (৩.০০)</p>
                <p>৪০+: C (২.০০) · &lt;৪০%: F (০.০০)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">*বিশেষ চাহিদা ৩৩%+ পাস (D = ১.০০)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-900 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-950"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
