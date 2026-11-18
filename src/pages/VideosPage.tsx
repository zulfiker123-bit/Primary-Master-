import React, { useState, useMemo } from 'react';
import { Play, Plus, X, Clock } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { CLASS_LEVELS, INITIAL_VIDEOS } from '../data/curriculum';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RouteKey, VideoItem } from '../types';
import classroomPhoto from '../assets/images/classroom_lesson_visual_1794703907497.jpg';

interface VideosPageProps {
  onNavigate: (route: RouteKey) => void;
}

const CATEGORIES = [
  'সকল ভিডিও',
  'শ্রেণিভিত্তিক পাঠ ও ছড়া',
  'শিক্ষক প্রশিক্ষণ ও আইসিটি',
  'কাব স্কাউট ও সমাবেশ',
  'শিক্ষামূলক বিনোদন',
] as const;

export default function VideosPage({ onNavigate }: VideosPageProps) {
  const [videos, setVideos] = useLocalStorage<VideoItem[]>('edu_videos_v1', INITIAL_VIDEOS);
  const [selectedCat, setSelectedCat] = useState<string>('সকল ভিডিও');
  const [selectedClass, setSelectedClass] = useState<string>('সকল শ্রেণি');
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newVid, setNewVid] = useState({
    title: '',
    category: 'শ্রেণিভিত্তিক পাঠ ও ছড়া' as VideoItem['category'],
    classLevel: 'প্রথম শ্রেণি',
    duration: '১০:০০',
    youtubeUrl: '',
    description: '',
  });

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const mCat = selectedCat === 'সকল ভিডিও' || v.category === selectedCat;
      const mCls = selectedClass === 'সকল শ্রেণি' || v.classLevel === selectedClass;
      return mCat && mCls;
    });
  }, [videos, selectedCat, selectedClass]);

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
    return match ? match[1] : 'dQw4w9WgXcQ';
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVid.title.trim()) return;
    const item: VideoItem = {
      id: `vid-${Date.now()}`,
      title: newVid.title.trim(),
      category: newVid.category,
      classLevel: newVid.classLevel,
      duration: newVid.duration || '১০:০০',
      youtubeId: extractYoutubeId(newVid.youtubeUrl),
      description: newVid.description.trim() || 'শিক্ষক কর্তৃক যুক্তকৃত শিক্ষামূলক ভিডিও।',
    };
    setVideos((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewVid({
      title: '',
      category: 'শ্রেণিভিত্তিক পাঠ ও ছড়া',
      classLevel: 'প্রথম শ্রেণি',
      duration: '১০:০০',
      youtubeUrl: '',
      description: '',
    });
  };

  return (
    <PageShell
      title="শিক্ষামূলক ভিডিও গ্যালারি"
      subtitle="শ্রেণিভিত্তিক পাঠদান, ছড়া, প্রশিক্ষণ ও মাল্টিমিডিয়া ক্লাসরুম"
      onNavigate={onNavigate}
      actions={
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন ভিডিও যুক্ত করুন</span>
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-5 rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCat === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium"
        >
          <option value="সকল শ্রেণি">সকল শ্রেণি</option>
          {CLASS_LEVELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="সাধারণ / প্রশিক্ষণ">সাধারণ / প্রশিক্ষণ</option>
        </select>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((vid) => (
          <article
            key={vid.id}
            className="card-interactive rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col"
          >
            <button
              type="button"
              onClick={() => setPlayingVideo(vid)}
              className="relative aspect-video w-full bg-slate-900 overflow-hidden group text-left"
            >
              <img
                src={classroomPhoto}
                alt={vid.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </span>
              </div>
              <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums">
                <Clock className="h-3 w-3" />
                {vid.duration}
              </span>
            </button>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{vid.classLevel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{vid.category}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 leading-snug">
                  {vid.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {vid.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(vid)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-600 hover:text-white transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>ভিডিও দেখুন</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate pr-4">
                {playingVideo.title}
              </h3>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                title={playingVideo.title}
                src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {playingVideo.description}
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">নতুন ভিডিও যুক্ত করুন</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddVideo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ভিডিওর শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={newVid.title}
                  onChange={(e) => setNewVid({ ...newVid, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ক্যাটাগরি</label>
                  <select
                    value={newVid.category}
                    onChange={(e) =>
                      setNewVid({ ...newVid, category: e.target.value as VideoItem['category'] })
                    }
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  >
                    {CATEGORIES.slice(1).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শ্রেণি</label>
                  <select
                    value={newVid.classLevel}
                    onChange={(e) => setNewVid({ ...newVid, classLevel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  >
                    {CLASS_LEVELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="সাধারণ / প্রশিক্ষণ">সাধারণ / প্রশিক্ষণ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  YouTube ভিডিও লিংক
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVid.youtubeUrl}
                  onChange={(e) => setNewVid({ ...newVid, youtubeUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  value={newVid.description}
                  onChange={(e) => setNewVid({ ...newVid, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
