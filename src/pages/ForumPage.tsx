import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Send, Users } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { INITIAL_FORUM_POSTS } from '../data/curriculum';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ForumPost, RouteKey, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';

interface ForumPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

export default function ForumPage({ profile, onNavigate }: ForumPageProps) {
  const [posts, setPosts] = useLocalStorage<ForumPost[]>('teacher_forum_v1', INITIAL_FORUM_POSTS);
  const [newPost, setNewPost] = useState('');
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPost.trim();
    if (!trimmed) return;
    const item: ForumPost = {
      id: `fp-${Date.now()}`,
      author: profile.name || 'সম্মানিত শিক্ষক',
      school: profile.school || 'সরকারি প্রাথমিক বিদ্যালয়',
      date: getFormattedBanglaDate(),
      content: trimmed,
      likes: 0,
      replies: [],
    };
    setPosts((prev) => [item, ...prev]);
    setNewPost('');
  };

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextLiked = !p.likedByMe;
        return {
          ...p,
          likedByMe: nextLiked,
          likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      })
    );
  };

  const handleReplySubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                {
                  id: `fr-${Date.now()}`,
                  author: profile.name || 'শিক্ষক',
                  school: profile.school,
                  date: getFormattedBanglaDate(),
                  text: replyText.trim(),
                },
              ],
            }
          : p
      )
    );
    setReplyText('');
    setReplyOpenId(null);
  };

  return (
    <PageShell
      title="শিক্ষক ফোরাম ও মতামত"
      subtitle="শিক্ষা সংক্রান্ত মতামত, পরামর্শ ও শ্রেণিকক্ষের অভিজ্ঞতা বিনিময়"
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Composer & Community Banner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-emerald-700 text-white p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
              <Users className="h-4 w-4" />
              <span>শিক্ষক কমিউনিটি আপডেট</span>
            </div>
            <h2 className="text-base font-bold">অ্যাপ ও শিক্ষা সংক্রান্ত আপডেট পেতে যুক্ত থাকুন</h2>
            <p className="text-xs text-emerald-100 leading-relaxed">
              বিদ্যালয় ও সহকর্মীদের সাথে শ্রেণিকক্ষের অভিজ্ঞতা, পাঠ পরিকল্পনা ও মূল্যায়নের পরামর্শ নিচের ফোরামে লিখে সংরক্ষণ করুন।
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('forum-post-textarea')?.focus()}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors"
            >
              <span>নতুন আলোচনা শুরু করুন</span>
            </button>
          </div>

          <form
            onSubmit={handlePublish}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900">আপনার মতামত বা আলোচনা লিখুন</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              শিক্ষা সংক্রান্ত কোনো মতামত, এই অ্যাপ নিয়ে আপনার মূল্যবান পরামর্শ কিংবা শ্রেণিকক্ষের অভিজ্ঞতা এখানে শেয়ার করুন।
            </p>
            <textarea
              id="forum-post-textarea"
              rows={4}
              maxLength={500}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="আপনার মতামত লিখুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-600 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 tabular-nums">
                {toBanglaDigit(newPost.length)} / ৫০০
              </span>
              <button
                type="submit"
                disabled={!newPost.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>পোস্ট করুন</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Posts Stream */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-bold text-slate-900 text-sm">সাম্প্রতিক আলোচনা সমূহ</span>
            <span className="tabular-nums">মোট মতামত: {toBanglaDigit(posts.length + 124)} টি</span>
          </div>

          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  {post.author.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900">{post.author}</h4>
                  <p className="text-xs text-slate-500 truncate">
                    {post.school} · {post.date}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed">{post.content}</p>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
                    post.likedByMe ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="tabular-nums">{toBanglaDigit(post.likes)} পছন্দ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplyOpenId(replyOpenId === post.id ? null : post.id)}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>রিপ্লাই ({toBanglaDigit(post.replies.length)})</span>
                </button>
              </div>

              {post.replies.length > 0 && (
                <div className="space-y-2 pt-2">
                  {post.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900">
                        {rep.author}{' '}
                        <span className="font-normal text-slate-500">· {rep.date}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rep.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyOpenId === post.id && (
                <form
                  onSubmit={(e) => handleReplySubmit(e, post.id)}
                  className="flex gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="আপনার উত্তর লিখুন..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    পাঠান
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
