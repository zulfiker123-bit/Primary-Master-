import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Printer, FileDown, Loader2, Type, Users } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead, OfficialWatermark } from '../components/OfficialEmblems';
import { CLASS_LEVELS } from '../data/curriculum';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RouteKey, Student, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';
import { usePrintPreferences } from '../utils/printPreferences';

interface CertificatesPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
  printReady?: boolean;
  onTogglePrintReady?: () => void;
}

type CertType = 'testimonial' | 'certificate' | 'tc' | 'general';

function computeBaseBodyFontPx(charCount: number): number {
  if (charCount <= 260) return 20;
  if (charCount <= 350) return 18.5;
  if (charCount <= 440) return 17;
  if (charCount <= 540) return 15.5;
  if (charCount <= 680) return 14;
  if (charCount <= 840) return 12.8;
  return 11.5;
}

export default function CertificatesPage({
  profile,
  onNavigate,
  printReady = false,
  onTogglePrintReady,
}: CertificatesPageProps) {
  const [registeredStudents] = useLocalStorage<Student[]>('students_list_v1', []);
  const [printPrefs] = usePrintPreferences();

  const [certType, setCertType] = useState<CertType>('testimonial');
  const [studentName, setStudentName] = useState('সাদিয়া আক্তার');
  const [gender, setGender] = useState<'ছাত্র' | 'ছাত্রী'>('ছাত্রী');
  const [fatherName, setFatherName] = useState('মো: কামাল উদ্দিন');
  const [motherName, setMotherName] = useState('হালিমা বেগম');
  const [village, setVillage] = useState(
    profile.villagePost?.split(',')[0]?.trim() || 'কোলা'
  );
  const [postOffice, setPostOffice] = useState(
    profile.villagePost?.split(',')[1]?.trim() || 'মাড়িয়ালা'
  );
  const [upazila, setUpazila] = useState(profile.upazila || 'আশাশুনি');
  const [district, setDistrict] = useState(profile.district || 'সাতক্ষীরা');
  const [classLevel, setClassLevel] = useState('পঞ্চম শ্রেণি');
  const [roll, setRoll] = useState('০১');
  const [sessionYear, setSessionYear] = useState('২০২৬');
  const [dob, setDob] = useState('১০/০৪/২০১৫');
  const [schoolName, setSchoolName] = useState(
    profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়'
  );
  const [establishedYear, setEstablishedYear] = useState('১৯৭২');
  const [issueDate, setIssueDate] = useState(getFormattedBanglaDate());
  const [customRemark, setCustomRemark] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const certRef = useRef<HTMLDivElement>(null);
  const certFrameRef = useRef<HTMLDivElement>(null);
  const certContentRef = useRef<HTMLDivElement>(null);

  const certHeading =
    certType === 'testimonial'
      ? 'প্রশংসাপত্র (Testimonial)'
      : certType === 'certificate'
      ? 'সমাপনী ও কৃতিত্ব সনদপত্র (Certificate)'
      : certType === 'tc'
      ? 'বিদ্যালয় ছাড়পত্র (Transfer Certificate / TC)'
      : 'প্রত্যয়নপত্র';

  const pronoun = 'সে';
  const poss = 'তার';

  const secondParagraphText = useMemo(() => {
    if (certType === 'tc') {
      return `${pronoun} বিদ্যালয়ের সকল পাওনাদি পরিশোধ করেছে এবং অভিভাবকের আবেদনের পরিপ্রেক্ষিতে ${poss} অন্য বিদ্যালয়ে ভর্তির নিমিত্তে এই ছাড়পত্র (TC) প্রদান করা হলো। অত্র বিদ্যালয়ে অধ্যয়নকালে ${poss} স্বভাব-চরিত্র ও উপস্থিতি সন্তোষজনক ছিল।`;
    }
    if (certType === 'certificate') {
      return `${pronoun} অত্র বিদ্যালয়ের ধারাবাহিক ও সামষ্টিক মূল্যায়ন এবং সকল প্রান্তিক যোগ্যতা (FLN) সফলভাবে অর্জন করেছে। ${poss} মেধা, নৈতিক আচরণ ও সহপাঠক্রমিক কৃতিত্বের স্বীকৃতিস্বরূপ এই সনদপত্র (Certificate) প্রদান করা হলো।`;
    }
    return `আমার জানামতে ${pronoun} একজন মেধাবী, বিনয়ী ও সুশৃঙ্খল শিক্ষার্থী। বিদ্যালয়ের সকল সহপাঠক্রমিক কার্যক্রমে ${poss} অংশগ্রহণ প্রশংসনীয় ছিল। আমি ${poss} জীবনের সর্বাঙ্গীণ উন্নতি ও উজ্জ্বল ভবিষ্যৎ কামনা করি।`;
  }, [certType, pronoun, poss]);

  const totalChars = useMemo(() => {
    const core =
      `${schoolName}${studentName}${fatherName}${motherName}${village}${postOffice}${upazila}${district}${classLevel}${roll}${sessionYear}${dob}${secondParagraphText}${customRemark}`;
    return core.trim().length + 140;
  }, [
    schoolName,
    studentName,
    fatherName,
    motherName,
    village,
    postOffice,
    upazila,
    district,
    classLevel,
    roll,
    sessionYear,
    dob,
    secondParagraphText,
    customRemark,
  ]);

  const baseBodyFontPx = useMemo(() => computeBaseBodyFontPx(totalChars), [totalChars]);
  const [overflowShrinkPx, setOverflowShrinkPx] = useState(0);

  // Reset manual shrink step whenever text length changes, then auto-fit cleanly inside the single A4 Landscape frame
  useEffect(() => {
    setOverflowShrinkPx(0);
  }, [totalChars, certType, printReady]);

  useLayoutEffect(() => {
    const frame = certFrameRef.current;
    const content = certContentRef.current;
    if (!frame || !content) return;
    if (content.scrollHeight > frame.clientHeight + 2 && baseBodyFontPx - overflowShrinkPx > 10.5) {
      setOverflowShrinkPx((prev) => Number((prev + 0.5).toFixed(1)));
    }
  }, [baseBodyFontPx, overflowShrinkPx, totalChars, certType, printReady]);

  const autoBodyFontPx = Math.max(10.5, Number((baseBodyFontPx - overflowShrinkPx).toFixed(1)));
  const effectiveBodyFontPx =
    printPrefs.fontSizeMode === 'custom' ? printPrefs.fontSizePx : autoBodyFontPx;
  const effectiveLineHeight =
    effectiveBodyFontPx >= 18
      ? 1.9
      : effectiveBodyFontPx >= 15
      ? 1.72
      : effectiveBodyFontPx >= 13
      ? 1.56
      : 1.44;
  const effectivePaddingPx =
    effectiveBodyFontPx >= 17 ? 28 : effectiveBodyFontPx >= 14 ? 22 : 16;

  const handleAutofillStudent = (id: string) => {
    const found = registeredStudents.find((s) => s.id === id);
    if (!found) return;
    setStudentName(found.name);
    setGender(found.gender);
    setFatherName(found.fatherName || fatherName);
    setMotherName(found.motherName || motherName);
    setVillage(found.village || village);
    setClassLevel(found.classLevel || classLevel);
    setRoll(found.roll || roll);
    if (found.dob) setDob(found.dob);
  };

  const handleExportPdf = async () => {
    if (!certRef.current || exportingPdf) return;
    setExportingPdf(true);
    setPdfError('');
    try {
      const safeName = `certificate-${certType}-${studentName || 'student'}`.replace(/\s+/g, '-');
      await exportElementToA4Pdf(certRef.current, safeName, {
        orientation: 'landscape',
        fitSinglePage: true,
      });
    } catch {
      setPdfError('PDF তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা প্রিন্ট অপশন ব্যবহার করুন।');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintLandscape = () => {
    triggerSmartPrint({
      element: certRef.current,
      filename: `certificate-${certType}-${studentName.replace(/\s+/g, '-') || 'student'}`,
      orientation: 'landscape',
      fitSinglePage: true,
    });
  };

  useEffect(() => {
    if (!printReady || !onTogglePrintReady) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTogglePrintReady();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [printReady, onTogglePrintReady]);

  return (
    <PageShell
      title="প্রশংসাপত্র, সার্টিফিকেট ও ছাড়পত্র (TC)"
      subtitle="A4 Landscape (২৯৭ × ২১০ মিমি) ফুল পেজে মার্জিনবিহীন (০ মিমি) প্রিন্ট ও PDF · লেখার বিস্তার অনুযায়ী স্বয়ংক্রিয় ফন্ট স্কেলিং"
      onNavigate={onNavigate}
      onPrint={handlePrintLandscape}
      printLabel="ফুল পেজ প্রিন্ট (Landscape)"
      printReady={printReady}
      onTogglePrintReady={onTogglePrintReady}
      onExportPdf={handleExportPdf}
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ (Landscape)"
    >
      {pdfError && (
        <div className="no-print mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
          {pdfError}
        </div>
      )}

      <div className={printReady ? 'block' : 'grid grid-cols-1 xl:grid-cols-12 gap-5 items-start'}>
        {/* Form Controls */}
        {!printReady && (
          <div className="no-print xl:col-span-4 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                সনদ / পত্রের ধরন নির্বাচন করুন
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'testimonial' as CertType, label: 'প্রশংসাপত্র' },
                  { id: 'certificate' as CertType, label: 'সার্টিফিকেট (সনদ)' },
                  { id: 'tc' as CertType, label: 'ছাড়পত্র (TC)' },
                  { id: 'general' as CertType, label: 'প্রত্যয়নপত্র' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCertType(t.id)}
                    className={`rounded-xl py-2 px-2.5 text-xs font-semibold border transition-colors ${
                      certType === t.id
                        ? 'bg-[#0F2922] text-white border-[#0F2922]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {registeredStudents.length > 0 && (
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5 space-y-1">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-950">
                  <Users className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>নিবন্ধিত শিক্ষার্থী থেকে অটো-ফিল:</span>
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => handleAutofillStudent(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="" disabled>
                    শিক্ষার্থী নির্বাচন করুন...
                  </option>
                  {registeredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.classLevel} · রোল {toBanglaDigit(s.roll)} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">শিক্ষার্থীর নাম</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">লিঙ্গ</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'ছাত্র' | 'ছাত্রী')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                >
                  <option value="ছাত্র">ছাত্র</option>
                  <option value="ছাত্রী">ছাত্রী</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পিতার নাম</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">মাতার নাম</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">গ্রাম</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ডাকঘর</label>
                <input
                  type="text"
                  value={postOffice}
                  onChange={(e) => setPostOffice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">শ্রেণি</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">রোল নং</label>
                <input
                  type="text"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">শিক্ষাবর্ষ</label>
                <input
                  type="text"
                  value={sessionYear}
                  onChange={(e) => setSessionYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">জন্ম তারিখ</label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">স্থাপিত (সাল)</label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">বিদ্যালয়ের নাম</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                placeholder="উপজেলা"
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="জেলা"
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="প্রদানের তারিখ"
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                অতিরিক্ত বিবরণ / কৃতিত্ব বা মন্তব্য (ঐচ্ছিক — লেখা বাড়লে ফন্ট নিজে থেকে সমন্বয় হবে)
              </label>
              <textarea
                rows={2}
                value={customRemark}
                onChange={(e) => setCustomRemark(e.target.value)}
                placeholder="যেমন: বার্ষিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতায় প্রথম স্থান অর্জন অথবা বিশেষ কারণ..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-[11px] text-slate-700">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Type className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>
                  ফন্ট: {toBanglaDigit(effectiveBodyFontPx)} px (
                  {printPrefs.fontSizeMode === 'custom' ? 'নির্ধারিত' : 'অটো'})
                </span>
              </span>
              <span className="font-semibold text-emerald-800">
                Landscape (মার্জিন: {toBanglaDigit(printPrefs.marginMm)} মিমি)
              </span>
            </div>
          </div>
        )}

        {/* Full-Page A4 Landscape Ornate Certificate / TC Sheet (297mm × 210mm, Zero Margin) */}
        <div className={printReady ? 'block' : 'xl:col-span-8 space-y-3'}>
          <div
            ref={certRef}
            className="a4-landscape-sheet print-only-sheet bg-white text-slate-900"
          >
            <div
              ref={certFrameRef}
              className="relative overflow-hidden flex-1 h-full w-full flex flex-col border-[6px] border-double border-emerald-900 p-2 bg-white box-border"
            >
              <OfficialWatermark opacityClass="opacity-[0.055]" />
              <div
                ref={certContentRef}
                style={{ padding: `${effectivePaddingPx}px` }}
                className="relative z-10 flex-1 h-full flex flex-col justify-between border-2 border-emerald-400/90 rounded-sm"
              >
                <div>
                  <OfficialA4Letterhead
                    schoolName={schoolName}
                    addressLine={`স্থাপিত: ${toBanglaDigit(establishedYear)} ইং · উপজেলা: ${upazila}, জেলা: ${district}`}
                    documentTitle={certHeading}
                    compact={effectiveBodyFontPx < 16}
                    className={effectiveBodyFontPx < 15 ? 'mb-3 pb-2' : 'mb-4'}
                  />

                  <div
                    style={{ fontSize: `${Math.max(11, effectiveBodyFontPx - 4)}px` }}
                    className="flex justify-between text-slate-600 mb-3 font-semibold"
                  >
                    <span>
                      স্মারক নং: প্রাবি/সনদ/{toBanglaDigit(sessionYear)}/{toBanglaDigit(roll)}
                    </span>
                    <span>প্রদানের তারিখ: {issueDate}</span>
                  </div>

                  <div
                    style={{
                      fontSize: `${effectiveBodyFontPx}px`,
                      lineHeight: effectiveLineHeight,
                    }}
                    className="space-y-3 text-justify text-slate-900"
                  >
                    <p>
                      এই মর্মে প্রত্যয়ন/প্রশংসা করা যাচ্ছে যে,{' '}
                      <strong className="underline decoration-dotted text-emerald-950">
                        {studentName}
                      </strong>
                      , পিতা: <strong>{fatherName}</strong>, মাতা: <strong>{motherName}</strong>, গ্রাম:{' '}
                      {village}, ডাকঘর: {postOffice}, উপজেলা: {upazila}, জেলা: {district} — অত্র বিদ্যালয়ের{' '}
                      <strong>{toBanglaDigit(sessionYear)}</strong> শিক্ষাবর্ষের{' '}
                      <strong>{classLevel}</strong>-র একজন নিয়মিত {gender}। {poss} শ্রেণি রোল{' '}
                      <strong>{toBanglaDigit(roll)}</strong> এবং ভর্তি রেজিস্টার অনুযায়ী জন্ম তারিখ{' '}
                      <strong>{toBanglaDigit(dob)}</strong>।
                    </p>

                    <p>{secondParagraphText}</p>

                    {customRemark.trim() && (
                      <p className="font-medium text-emerald-950">{customRemark.trim()}</p>
                    )}
                  </div>
                </div>

                <div
                  style={{ fontSize: `${Math.max(11.5, effectiveBodyFontPx - 3.5)}px` }}
                  className="pt-6 flex items-end justify-between"
                >
                  <div className="text-center">
                    <p className="border-t border-slate-800 pt-1 px-5 font-medium">
                      শ্রেণি শিক্ষকের স্বাক্ষর
                    </p>
                  </div>
                  <div className="text-center text-[11px] text-slate-500">
                    <span>বিদ্যালয়ের কার্যালয় সিল</span>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-slate-800 pt-1 px-6 font-bold text-slate-950">
                      প্রধান শিক্ষকের স্বাক্ষর ও সিল
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!printReady && (
            <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-3">
              <span className="text-xs text-slate-600">
                A4 Landscape ফুল পেজ (২৯৭ × ২১০ মিমি · মার্জিন: {toBanglaDigit(printPrefs.marginMm)} মিমি · ফন্ট:{' '}
                {toBanglaDigit(effectiveBodyFontPx)} px)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {exportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'ফুল পেজ PDF (Landscape)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintLandscape}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F2922] px-4 text-xs font-semibold text-white hover:bg-emerald-950"
                >
                  <Printer className="h-4 w-4" />
                  <span>ফুল পেজ প্রিন্ট (Landscape)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
