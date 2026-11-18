import React, { useState, useRef } from 'react';
import { ExternalLink, FileText, Calendar, X, Printer, FileDown, Loader2 } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead } from '../components/OfficialEmblems';
import { HOLIDAYS_2026, OFFICIAL_PORTALS } from '../data/curriculum';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { PortalLinkItem, RouteKey } from '../types';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface PortalsPageProps {
  onNavigate: (route: RouteKey) => void;
}

type DocType = 'holidays' | 'leave_rules' | 'pension_rules' | null;

export default function PortalsPage({ onNavigate }: PortalsPageProps) {
  const [portals] = useLocalStorage<PortalLinkItem[]>('custom_portals_v1', OFFICIAL_PORTALS);
  const [viewerDoc, setViewerDoc] = useState<DocType>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!docRef.current || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(docRef.current, `portal-${viewerDoc || 'doc'}`);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <PageShell
      title="পোর্টাল ও নির্দেশিকা"
      subtitle="প্রাথমিক শিক্ষার জরুরি সরকারি পোর্টাল, ছুটির তালিকা-২০২৬, ছুটি বিধি ও পেনশন নির্দেশিকা"
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Official Portals */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">জরুরি ওয়েব পোর্টাল</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portals.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-interactive flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:border-blue-400 hover:bg-white"
              >
                <div>
                  <span className="text-[11px] font-semibold text-blue-700">{portal.badge}</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                    {portal.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {portal.description}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  <span>পোর্টালে প্রবেশ করুন</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Leave & Rules Documents */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
            ছুটির তালিকা ও সরকারি বিধিমালা
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'holidays' as DocType,
                title: 'ছুটির ক্যালেন্ডার - ২০২৬',
                updated: 'আপডেটের তারিখ: ০৭ Oct, ২০২৬',
                icon: Calendar,
              },
              {
                id: 'leave_rules' as DocType,
                title: 'সরকারি প্রাথমিক শিক্ষক ছুটি বিধি',
                updated: 'আপডেটের তারিখ: ১২ Oct, ২০২৬',
                icon: FileText,
              },
              {
                id: 'pension_rules' as DocType,
                title: 'পেনশন ও পিআরএল (PRL) বিধিমালা',
                updated: 'আপডেটের তারিখ: ১২ Oct, ২০২৬',
                icon: FileText,
              },
            ].map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.updated}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewerDoc(doc.id)}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                  >
                    দেখুন
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={docRef}
            className="print-only-sheet w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="no-print flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setViewerDoc(null)}
                aria-label="বন্ধ করুন"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <OfficialA4Letterhead
              schoolName={
                viewerDoc === 'holidays'
                  ? 'সরকারি প্রাথমিক বিদ্যালয়ের ছুটির তালিকা - ২০২৬'
                  : viewerDoc === 'leave_rules'
                  ? 'নৈমিত্তিক ও অর্জিত ছুটি বিধিমালা'
                  : 'সরকারি কর্মচারী পেনশন ও পিআরএল নির্দেশিকা'
              }
              addressLine="প্রাথমিক শিক্ষা অধিদপ্তর · প্রাইমারি মাস্টার রেফারেন্স"
              compact
            />

            {viewerDoc === 'holidays' ? (
              <table className="w-full border-collapse border border-slate-300 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-300 p-2 text-center">ক্রমিক</th>
                    <th className="border border-slate-300 p-2">পর্ব / উপলক্ষ</th>
                    <th className="border border-slate-300 p-2">তারিখ</th>
                    <th className="border border-slate-300 p-2 text-center">দিন</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLIDAYS_2026.map((h) => (
                    <tr key={h.sl}>
                      <td className="border border-slate-300 p-2 text-center">{h.sl}</td>
                      <td className="border border-slate-300 p-2 font-medium">{h.occasion}</td>
                      <td className="border border-slate-300 p-2">{h.date}</td>
                      <td className="border border-slate-300 p-2 text-center">{h.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : viewerDoc === 'leave_rules' ? (
              <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
                <li className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <strong>১. নৈমিত্তিক ছুটি (Casual Leave):</strong> বছরে সর্বোচ্চ ২০ দিন ভোগ করা যায়। একসাথে সাধারণত ১০ দিনের বেশি নেওয়া যায় না এবং এটি সরকারি ছুটির সাথে যুক্ত করা যায়।
                </li>
                <li className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <strong>২. মাতৃত্বকালীন ছুটি:</strong> সরকারি প্রাথমিক বিদ্যালয়ের নারী শিক্ষকগণ পূর্ণ বেতনে ৬ মাস (১৮০ দিন) পর্যন্ত প্রসূতি ছুটি ভোগ করতে পারবেন।
                </li>
                <li className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <strong>৩. অর্জিত ছুটি ও চিকিৎসা ছুটি:</strong> ভেকেশন ডিপার্টমেন্ট হিসেবে নির্ধারিত নিয়মে অর্জিত ছুটি ও মেডিকেল সার্টিফিকেটের ভিত্তিতে চিকিৎসা ছুটি মঞ্জুর হয়।
                </li>
              </ul>
            ) : (
              <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
                <li className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <strong>১. অবসর উত্তর ছুটি (PRL):</strong> ৫৯ বছর পূর্ণ হওয়ার পর ১ বছর (১২ মাস) অবসর উত্তর ছুটি ভোগ করা যায়।
                </li>
                <li className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <strong>২. আনুতোষিক ও মাসিক পেনশন:</strong> ২৫ বছর চাকরি পূর্ণ হলে পূর্ণ পেনশন প্রাপ্য হন। সর্বশেষ মূল বেতনের ৯০% এর অর্ধেক মাসিক পেনশন এবং বাকি অর্ধেক ২৩০ গুণ হারে এককালীন আনুতোষিক প্রদান করা হয়।
                </li>
                <li className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <strong>৩. প্রয়োজনীয় কাগজপত্র:</strong> সার্ভিস বই, এলপিসি (LPC), অনাপত্তিপত্র (NOC) ও পিআরএল মঞ্জুরির আদেশ সংরক্ষণ করতে হয়।
                </li>
              </ul>
            )}

            <div className="no-print mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewerDoc(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF সংরক্ষণ (A4)'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerSmartPrint({
                    element: docRef.current,
                    filename: `portal-${viewerDoc || 'doc'}`,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-950"
              >
                <Printer className="h-4 w-4" />
                <span>প্রিন্ট (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
