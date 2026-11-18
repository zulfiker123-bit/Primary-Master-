import React, { useState, useRef } from 'react';
import { Printer, FileDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { DPE_LOGO_SRC, OfficialA4Letterhead } from '../components/OfficialEmblems';
import { CLASS_LEVELS } from '../data/curriculum';
import { RouteKey, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';
import { usePrintPreferences } from '../utils/printPreferences';

interface ApplicationsPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

type AppTemplate = 'assistant_cl' | 'head_cl' | 'home_visit' | 'joining_report';

export default function ApplicationsPage({ profile, onNavigate }: ApplicationsPageProps) {
  const [activeTab, setActiveTab] = useState<AppTemplate>('assistant_cl');
  const [exportingPdf, setExportingPdf] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const [teacherName, setTeacherName] = useState(profile.name);
  const [designation, setDesignation] = useState(profile.designation);
  const [school, setSchool] = useState(profile.school);
  const [upazila, setUpazila] = useState(profile.upazila);
  const [district, setDistrict] = useState(profile.district);

  const [reason, setReason] = useState('পারিবারিক ও শারীরিক অসুস্থতাজনিত কারণে');
  const [startDate, setStartDate] = useState('২০২৬-১১-১৬');
  const [endDate, setEndDate] = useState('২০২৬-১১-১৭');
  const [totalDays, setTotalDays] = useState(2);
  const [substituteName, setSubstituteName] = useState('মোছা: রাবেয়া খাতুন');
  const [substituteDesig, setSubstituteDesig] = useState('সহকারী শিক্ষক');
  const [leaveEnjoyed, setLeaveEnjoyed] = useState(4);
  const [leaveRemaining, setLeaveRemaining] = useState(14);

  const [visitDate, setVisitDate] = useState(getFormattedBanglaDate());
  const [stayTime, setStayTime] = useState('সকাল ১১:০০ হতে ১১:৩০ ঘটিকা');
  const [blankHomeVisitMode, setBlankHomeVisitMode] = useState(false);
  const [visitStudents, setVisitStudents] = useState<Array<{ name: string; classLevel: string; roll: string }>>([
    { name: 'তানভীর আহমেদ', classLevel: 'চতুর্থ শ্রেণি', roll: '০৫' },
  ]);
  const [outOfSchoolChildren, setOutOfSchoolChildren] = useState<
    Array<{ name: string; fatherName: string; motherName: string }>
  >([{ name: '', fatherName: '', motherName: '' }]);
  const [homeAddress, setHomeAddress] = useState(
    profile.villagePost || 'কোলা, মাড়িয়ালা'
  );
  const [distanceKm, setDistanceKm] = useState('১.৫');
  const [discussionTopic, setDiscussionTopic] = useState(
    'নিয়মিত বিদ্যালয়ে উপস্থিতি ও শ্রেণিকক্ষের পাঠ অনুশীলন'
  );
  const [outOfSchoolReason, setOutOfSchoolReason] = useState('প্রযোজ্য নয় (বাড়িতে বিদ্যালয় বহির্ভূত শিশু নেই)');
  const [absenceReason, setAbsenceReason] = useState('সাময়িক শারীরিক অসুস্থতা ও মৌসুমি জ্বর');
  const [studyDiscussion, setStudyDiscussion] = useState(
    'প্রতিদিন বাড়িতে কমপক্ষে ১ ঘণ্টা বাংলা ও গণিত অনুশীলন নিশ্চিত করতে এবং নিয়মিত বিদ্যালয়ে পাঠাতে অভিভাবককে পরামর্শ দেওয়া হয়েছে।'
  );
  const [visitOutcome, setVisitOutcome] = useState(
    'অভিভাবক আগামীকাল থেকেই শিক্ষার্থীকে নিয়মিত বিদ্যালয়ে পাঠানোর ও বাড়ির কাজ তদারকি করার অঙ্গীকার করেছেন।'
  );
  const [guardianAttestationName, setGuardianAttestationName] = useState('মো: কামাল হোসেন');

  const templates: { id: AppTemplate; label: string }[] = [
    { id: 'assistant_cl', label: 'সহকারী শিক্ষকের ছুটি' },
    { id: 'head_cl', label: 'প্রধান শিক্ষকের ছুটি' },
    { id: 'home_visit', label: 'হোম ভিজিট ফরম' },
    { id: 'joining_report', label: 'যোগদান / ছুটি ভোগ প্রতিবেদন' },
  ];

  const [printPrefs] = usePrintPreferences();

  const letterTextChars =
    activeTab === 'home_visit'
      ? teacherName.length +
        school.length +
        discussionTopic.length +
        outOfSchoolReason.length +
        absenceReason.length +
        studyDiscussion.length +
        visitOutcome.length
      : teacherName.length +
        school.length +
        reason.length +
        substituteName.length;
  const dynamicLetterFontPx =
    printPrefs.fontSizeMode === 'custom'
      ? printPrefs.fontSizePx
      : activeTab === 'home_visit'
      ? letterTextChars <= 260
        ? 14
        : letterTextChars <= 420
        ? 13
        : 12
      : letterTextChars <= 130
      ? 15.5
      : letterTextChars <= 210
      ? 14
      : letterTextChars <= 320
      ? 13
      : 12;

  const handleExportPdf = async () => {
    if (!letterRef.current || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(letterRef.current, `application-${activeTab}`);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <PageShell
      title="রেডিমেড অ্যাপ্লিকেশন (আবেদন সমূহ)"
      subtitle="প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূরণকৃত নৈমিত্তিক ছুটি, হোম ভিজিট ও যোগদান ফরম (A4 মার্জিনবিহীন · অটো-ফন্ট)"
      onNavigate={onNavigate}
      onPrint={() =>
        triggerSmartPrint({
          element: letterRef.current,
          filename: `application-${activeTab}`,
        })
      }
      printLabel="আবেদন প্রিন্ট (A4)"
      onExportPdf={handleExportPdf}
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ"
    >
      {/* Template Tabs */}
      <div className="no-print mb-5 flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Inputs */}
        <div className="no-print lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            আবেদনের তথ্য পূরণ করুন
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">শিক্ষকের নাম</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">পদবি</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">বিদ্যালয়ের নাম</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">উপজেলা</label>
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">জেলা</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {activeTab === 'home_visit' ? (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/70 border border-emerald-200 px-3 py-2">
                <span className="text-xs font-semibold text-emerald-950">ফরম প্রিন্টের ধরন:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBlankHomeVisitMode(false)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      !blankHomeVisitMode
                        ? 'bg-[#0F2922] text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    পূরণকৃত
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlankHomeVisitMode(true)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      blankHomeVisitMode
                        ? 'bg-[#0F2922] text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    খালি ফরম
                  </button>
                </div>
              </div>

              {!blankHomeVisitMode && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">০২. ভিজিটের তারিখ</label>
                      <input
                        type="text"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">অবস্থানের সময়</label>
                      <input
                        type="text"
                        value={stayTime}
                        onChange={(e) => setStayTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* 03. Students list */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        ০৩. বাড়ির ছাত্র/ছাত্রীর তথ্য
                      </label>
                      {visitStudents.length < 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisitStudents((prev) => [
                              ...prev,
                              { name: '', classLevel: 'প্রথম শ্রেণি', roll: '' },
                            ])
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                        >
                          <Plus className="h-3 w-3" /> আরও যোগ
                        </button>
                      )}
                    </div>
                    {visitStudents.map((st, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="নাম"
                          value={st.name}
                          onChange={(e) =>
                            setVisitStudents((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                            )
                          }
                          className="col-span-5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <select
                          value={st.classLevel}
                          onChange={(e) =>
                            setVisitStudents((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, classLevel: e.target.value } : r
                              )
                            )
                          }
                          className="col-span-4 rounded-lg border border-slate-200 px-1.5 py-1.5 text-xs"
                        >
                          {CLASS_LEVELS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="রোল"
                          value={st.roll}
                          onChange={(e) =>
                            setVisitStudents((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, roll: e.target.value } : r))
                            )
                          }
                          className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        {visitStudents.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setVisitStudents((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="সারি মুছুন"
                            className="col-span-1 text-slate-400 hover:text-rose-600 flex justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 04. Out-of-school children */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        ০৪. বিদ্যালয় বহির্ভূত ছেলে/মেয়ের তথ্য
                      </label>
                      {outOfSchoolChildren.length < 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOutOfSchoolChildren((prev) => [
                              ...prev,
                              { name: '', fatherName: '', motherName: '' },
                            ])
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                        >
                          <Plus className="h-3 w-3" /> আরও যোগ
                        </button>
                      )}
                    </div>
                    {outOfSchoolChildren.map((ch, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="নাম"
                          value={ch.name}
                          onChange={(e) =>
                            setOutOfSchoolChildren((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                            )
                          }
                          className="col-span-4 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="পিতার নাম"
                          value={ch.fatherName}
                          onChange={(e) =>
                            setOutOfSchoolChildren((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, fatherName: e.target.value } : r
                              )
                            )
                          }
                          className="col-span-4 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="মাতার নাম"
                          value={ch.motherName}
                          onChange={(e) =>
                            setOutOfSchoolChildren((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, motherName: e.target.value } : r
                              )
                            )
                          }
                          className="col-span-3 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        {outOfSchoolChildren.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setOutOfSchoolChildren((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="সারি মুছুন"
                            className="col-span-1 text-slate-400 hover:text-rose-600 flex justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 05. Address & Distance */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ০৫. বাড়ির ঠিকানা
                      </label>
                      <input
                        type="text"
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        দূরত্ব (কি.মি.)
                      </label>
                      <input
                        type="text"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ০৬. পিতা/মাতা/অভিভাবকের সহিত আলোচনার বিষয়
                    </label>
                    <input
                      type="text"
                      value={discussionTopic}
                      onChange={(e) => setDiscussionTopic(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ৬. ক) বিদ্যালয় বহির্ভূতদের ভর্তি না করার কারণ
                    </label>
                    <input
                      type="text"
                      value={outOfSchoolReason}
                      onChange={(e) => setOutOfSchoolReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ৬. খ) ছাত্র/ছাত্রীর বিদ্যালয়ে অনুপস্থিতির কারণ
                    </label>
                    <input
                      type="text"
                      value={absenceReason}
                      onChange={(e) => setAbsenceReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ৬. গ) পড়াশোনা বিষয়ে আলোচনার সংক্ষিপ্ত বিবরণ
                    </label>
                    <textarea
                      rows={2}
                      value={studyDiscussion}
                      onChange={(e) => setStudyDiscussion(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ০৭. আলোচনার ফলে অর্জিত সাফল্য/ফলাফল
                    </label>
                    <textarea
                      rows={2}
                      value={visitOutcome}
                      onChange={(e) => setVisitOutcome(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ০৮. অভিভাবকের নাম (প্রত্যয়ন স্বাক্ষরকারীর জন্য)
                    </label>
                    <input
                      type="text"
                      value={guardianAttestationName}
                      onChange={(e) => setGuardianAttestationName(e.target.value)}
                      placeholder="অভিভাবকের নাম"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ছুটির কারণ</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শেষ তারিখ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মোট দিন</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    দায়িত্ব পালনকারী শিক্ষক
                  </label>
                  <input
                    type="text"
                    value={substituteName}
                    onChange={(e) => setSubstituteName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={substituteDesig}
                    onChange={(e) => setSubstituteDesig(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ইতিপূর্বে ভোগকৃত ছুটি (দিন)
                  </label>
                  <input
                    type="number"
                    value={leaveEnjoyed}
                    onChange={(e) => setLeaveEnjoyed(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    অবশিষ্ট পাওনা ছুটি (দিন)
                  </label>
                  <input
                    type="number"
                    value={leaveRemaining}
                    onChange={(e) => setLeaveRemaining(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live Official Letter / Home Visit Form Preview */}
        <div
          ref={letterRef}
          style={{ fontSize: `${dynamicLetterFontPx}px` }}
          className="lg:col-span-7 relative overflow-hidden print-only-sheet rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900 leading-relaxed"
        >
          {activeTab === 'home_visit' && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]"
            >
              <img
                src={DPE_LOGO_SRC}
                alt=""
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain select-none"
              />
            </div>
          )}

          <div className="relative z-10">
            <OfficialA4Letterhead
              schoolName={school}
              addressLine={`উপজেলাঃ ${upazila}, জেলাঃ ${district}।`}
              documentTitle={
                activeTab === 'home_visit'
                  ? 'ছাত্র/ছাত্রীর বাড়ি গমন (হোম ভিজিট) সংক্রান্ত'
                  : undefined
              }
              subtitle={
                activeTab === 'home_visit' ? 'প্রাথমিক ও গণশিক্ষা বিভাগ' : undefined
              }
              compact
              className="mb-4"
            />

            {activeTab === 'home_visit' ? (
              <div className="space-y-2.5 text-slate-900 leading-snug">
                <p>
                  <strong>০১. বাড়ি গমন (ভিজিট) কারী শিক্ষক/শিক্ষিকার নাম:</strong>{' '}
                  {blankHomeVisitMode
                    ? '....................................................................................'
                    : `${teacherName} (${designation})`}
                </p>

                <div className="flex flex-wrap justify-between gap-2">
                  <span>
                    <strong>০২. ভিজিটের তারিখ:</strong>{' '}
                    {blankHomeVisitMode ? '...........................................' : visitDate}
                  </span>
                  <span>
                    <strong>বাড়িতে অবস্থানের সময়:</strong>{' '}
                    {blankHomeVisitMode ? '........................................' : stayTime}
                  </span>
                </div>

                {/* 03. Enrolled students table */}
                <div className="space-y-1 pt-0.5">
                  <p className="font-semibold">
                    ০৩. যে বাড়িতে ভিজিট করা হয়েছে সে বাড়ির ছাত্র/ছাত্রীর তথ্য:
                  </p>
                  <table className="w-full border-collapse border border-slate-800 text-center">
                    <thead>
                      <tr className="bg-slate-50/80 font-bold">
                        <th className="border border-slate-800 py-1.5 px-2 w-1/2">নাম</th>
                        <th className="border border-slate-800 py-1.5 px-2 w-1/4">শ্রেণি</th>
                        <th className="border border-slate-800 py-1.5 px-2 w-1/4">রোল নং</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(blankHomeVisitMode
                        ? [{ name: '', classLevel: '', roll: '' }, { name: '', classLevel: '', roll: '' }]
                        : visitStudents
                      ).map((row, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-800 py-1.5 px-2 h-7 text-left">
                            {row.name || '\u00A0'}
                          </td>
                          <td className="border border-slate-800 py-1.5 px-2">
                            {row.classLevel || '\u00A0'}
                          </td>
                          <td className="border border-slate-800 py-1.5 px-2 tabular-nums">
                            {row.roll ? toBanglaDigit(row.roll) : '\u00A0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 04. Out-of-school children table */}
                <div className="space-y-1 pt-0.5">
                  <p className="font-semibold">
                    ০৪. যে বাড়ি ভিজিট করা হয়েছে সে বাড়ির বিদ্যালয় বহির্ভূত ছেলে/মেয়ের তথ্য:
                  </p>
                  <table className="w-full border-collapse border border-slate-800 text-center">
                    <thead>
                      <tr className="bg-slate-50/80 font-bold">
                        <th className="border border-slate-800 py-1.5 px-2 w-1/3">নাম</th>
                        <th className="border border-slate-800 py-1.5 px-2 w-1/3">পিতার নাম</th>
                        <th className="border border-slate-800 py-1.5 px-2 w-1/3">মাতার নাম</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(blankHomeVisitMode
                        ? [{ name: '', fatherName: '', motherName: '' }]
                        : outOfSchoolChildren
                      ).map((row, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-800 py-1.5 px-2 h-7 text-left">
                            {row.name || '\u00A0'}
                          </td>
                          <td className="border border-slate-800 py-1.5 px-2 text-left">
                            {row.fatherName || '\u00A0'}
                          </td>
                          <td className="border border-slate-800 py-1.5 px-2 text-left">
                            {row.motherName || '\u00A0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 05. Address & Distance */}
                <div className="flex flex-wrap justify-between gap-2 pt-0.5">
                  <span>
                    <strong>০৫. বাড়ির ঠিকানা:</strong>{' '}
                    {blankHomeVisitMode ? '.............................................................' : homeAddress}
                  </span>
                  <span>
                    <strong>বিদ্যালয় থেকে বাড়ির দূরত্ব:</strong>{' '}
                    {blankHomeVisitMode ? '...............' : toBanglaDigit(distanceKm)} কি.মি.।
                  </span>
                </div>

                {/* 06. Discussion Topics & Reasons */}
                <div className="space-y-1.5 pt-0.5">
                  <p>
                    <strong>০৬. পিতা/মাতা/অভিভাবকের সহিত আলোচনার বিষয়:</strong>{' '}
                    {blankHomeVisitMode
                      ? '........................................................................'
                      : discussionTopic}
                  </p>
                  <p className="pl-4">
                    <strong>৬. ক) বিদ্যালয় গমণ উপযোগী (বিদ্যালয় বহির্ভূত) ছেলে মেয়েদেরকে বিদ্যালয়ের ভর্তি না করার কারণ:</strong>{' '}
                    {blankHomeVisitMode
                      ? '.................................................................................................................'
                      : outOfSchoolReason}
                  </p>
                  <p className="pl-4">
                    <strong>৬. খ) ছাত্র/ছাত্রীর বিদ্যালয়ে অনুপস্থিতির কারণ:</strong>{' '}
                    {blankHomeVisitMode
                      ? '.................................................................................................................'
                      : absenceReason}
                  </p>
                  <p className="pl-4">
                    <strong>৬. গ) ছাত্র/ছাত্রীর পড়াশোনার বিষয়ে যে আলোচনা হয়েছে তা সংক্ষিপ্ত বিবরণ:</strong>{' '}
                    {blankHomeVisitMode
                      ? '.................................................................................................................'
                      : studyDiscussion}
                  </p>
                </div>

                {/* 07. Outcome */}
                <p>
                  <strong>০৭. আলোচনার ফলে অর্জিত সাফল্য/ফলাফল:</strong>{' '}
                  {blankHomeVisitMode
                    ? '..................................................................................................'
                    : visitOutcome}
                </p>

                {/* 08. Parent Attestation */}
                <div className="space-y-1 pt-0.5">
                  <p className="font-bold">০৮. পিতা/মাতা/অভিভাবকের প্রত্যয়ন:</p>
                  <p className="pl-5 text-justify leading-relaxed">
                    এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, জনাব{' '}
                    <span className="font-semibold">
                      {blankHomeVisitMode ? '....................................................' : teacherName}
                    </span>{' '}
                    অদ্য তারিখ:{' '}
                    <span className="font-semibold">
                      {blankHomeVisitMode ? '..........................' : visitDate}
                    </span>{' '}
                    সময়ে{' '}
                    <span className="font-semibold">
                      {blankHomeVisitMode ? '..............................' : stayTime}
                    </span>{' '}
                    আমার বাড়ি আসেন এবং উপরোক্ত বিষয়ে আলোচনা করেন।
                    {!blankHomeVisitMode && guardianAttestationName.trim()
                      ? ` (অভিভাবক: ${guardianAttestationName.trim()})`
                      : ''}
                  </p>
                </div>

                {/* Signatures */}
                <div className="pt-10 flex justify-between items-end text-xs font-semibold">
                  <span className="border-t border-slate-800 pt-1 px-4">
                    অভিভাবকের স্বাক্ষর ও তারিখ
                  </span>
                  <span className="border-t border-slate-800 pt-1 px-4">
                    ভিজিট কারীর স্বাক্ষর ও তারিখ
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              <div className="flex justify-between text-xs text-slate-600">
                <span>সূত্র: সরকারি প্রাথমিক বিদ্যালয় ছুটি বিধি</span>
                <span>তারিখ: {getFormattedBanglaDate()}</span>
              </div>

              <div>
                <p>বরাবর,</p>
                <p className="font-semibold">
                  {activeTab === 'head_cl' ? 'উপজেলা শিক্ষা অফিসার' : 'প্রধান শিক্ষক'},
                </p>
                <p>{activeTab === 'head_cl' ? `${upazila}, ${district}` : school}</p>
                {activeTab === 'assistant_cl' && <p>{upazila}, {district}</p>}
              </div>

              <p className="font-bold">
                বিষয়:{' '}
                {activeTab === 'joining_report'
                  ? 'নৈমিত্তিক ছুটি ভোগের পর বিদ্যালয়ে যোগদান প্রসঙ্গে।'
                  : `${toBanglaDigit(totalDays)} (${toBanglaDigit(totalDays)}) দিনের নৈমিত্তিক ছুটির আবেদন।`}
              </p>

              <p>মহোদয়,</p>
              <p className="text-justify">
                বিনীত নিবেদন এই যে, আমি {teacherName}, {designation}, {school}। আমার{' '}
                {reason} আগামী {toBanglaDigit(startDate)} তারিখ হতে {toBanglaDigit(endDate)}{' '}
                তারিখ পর্যন্ত মোট {toBanglaDigit(totalDays)} দিন{' '}
                {activeTab === 'joining_report'
                  ? 'নৈমিত্তিক ছুটি ভোগ শেষে আজ বিদ্যালয়ে যোগদান করলাম।'
                  : 'নৈমিত্তিক ছুটির প্রয়োজন। আমার অবর্তমানে বিদ্যালয়ের শ্রেণি কার্যক্রম সুষ্ঠুভাবে পরিচালনার জন্য ' +
                    `${substituteName} (${substituteDesig}) দায়িত্ব পালন করবেন।`}
              </p>

              <div className="rounded-xl border border-slate-300 p-3 text-xs bg-slate-50 grid grid-cols-3 gap-2">
                <div>ইতিপূর্বে ভোগকৃত ছুটি: {toBanglaDigit(leaveEnjoyed)} দিন</div>
                <div>প্রার্থীত ছুটি: {toBanglaDigit(totalDays)} দিন</div>
                <div>অবশিষ্ট পাওনা: {toBanglaDigit(Math.max(0, leaveRemaining - totalDays))} দিন</div>
              </div>

              <p>
                অতএব, মহোদয়ের নিকট বিনীত প্রার্থনা, আমাকে উক্ত {toBanglaDigit(totalDays)} দিনের
                নৈমিত্তিক ছুটি মঞ্জুর করে বাধিত করবেন।
              </p>

              <div className="pt-8 flex justify-between items-end text-xs">
                <div>
                  <p className="font-semibold">দায়িত্ব পালনকারীর সম্মতি:</p>
                  <p className="mt-6 border-t border-slate-500 pt-1 inline-block pr-6">
                    {substituteName} ({substituteDesig})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">বিনীত নিবেদক,</p>
                  <p className="mt-6 border-t border-slate-500 pt-1 inline-block pl-6">
                    {teacherName} ({designation})
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>

          <div className="no-print mt-6 flex flex-wrap justify-end gap-2.5 relative z-10">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
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
                  element: letterRef.current,
                  filename: `application-${activeTab}`,
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              <span>অফিসিয়াল ফরম প্রিন্ট (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
