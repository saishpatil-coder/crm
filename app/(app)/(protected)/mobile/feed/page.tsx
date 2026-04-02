"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import MediaUpload from "@/components/MediaUpload";
import { useColor, ThemeColor } from "@/context/ColorContext";
import { apiClient } from "@/lib/appClient";

// ─── Theme Mappings ──────────────────────────────────────────────
const themeStyles: Record<
  ThemeColor,
  { bg: string; text: string; textHover: string; activeBg: string; activeText: string }
> = {
  blue:   { bg: "bg-blue-600",   text: "text-blue-600",   textHover: "hover:text-blue-600",   activeBg: "bg-blue-50",   activeText: "text-blue-600" },
  green:  { bg: "bg-green-600",  text: "text-green-600",  textHover: "hover:text-green-600",  activeBg: "bg-green-50",  activeText: "text-green-600" },
  orange: { bg: "bg-orange-500", text: "text-orange-500", textHover: "hover:text-orange-500", activeBg: "bg-orange-50", activeText: "text-orange-600" },
  purple: { bg: "bg-purple-600", text: "text-purple-600", textHover: "hover:text-purple-600", activeBg: "bg-purple-50", activeText: "text-purple-600" },
  red:    { bg: "bg-red-600",    text: "text-red-600",    textHover: "hover:text-red-600",    activeBg: "bg-red-50",    activeText: "text-red-600" },
};

// ─── Types ───────────────────────────────────────────────────────
interface FeedPost {
  id: number;
  authorName: string;
  description: string;
  mediaType: string | null;
  mediaUrl: string | null;
  likesCount: number;
  isLikedByMe: boolean;
  createdAt: string;
}

// ─── Relative Time Helper ────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Initials Helper ─────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function FeedPage() {
  const { primaryColor } = useColor();
  const theme = themeStyles[primaryColor];

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ── Fetch Feed ──
  const fetchFeed = useCallback(async () => {
    try {
      const res = await apiClient.get("/feed");
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ── Optimistic Like Toggle ──
  const toggleLike = async (postId: number) => {
    // 1. Optimistically update UI immediately
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.isLikedByMe;
          return {
            ...p,
            isLikedByMe: newLiked,
            likesCount: newLiked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      })
    );

    // 2. Call API in the background
    try {
      const res = await apiClient.post(`/feed/${postId}/like`);
      // Reconcile with server truth
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likesCount: res.data.likesCount, isLikedByMe: res.data.isLikedByMe }
            : p
        )
      );
    } catch (err) {
      console.error("Like toggle failed:", err);
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const reverted = !p.isLikedByMe;
            return {
              ...p,
              isLikedByMe: reverted,
              likesCount: reverted ? p.likesCount + 1 : p.likesCount - 1,
            };
          }
          return p;
        })
      );
    }
  };

  // ── Share ──
  const handleShare = (post: FeedPost) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ 
        title: `Update from ${post.authorName}`, 
        text: post.description,
        url: postUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(postUrl);
      alert("Link copied to clipboard!");
    }
  };

  // ── Handle New Post Created ──
  const handlePostCreated = (newPost: FeedPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col md:max-w-md md:mx-auto md:border-x border-gray-200">
      <Header />

      <div className="mt-16 pb-24 flex flex-col p-4 gap-5">
        {/* ── Title Row ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Campaign Feed
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Latest updates from your team
            </p>
          </div>
          <button
            onClick={fetchFeed}
            className="p-2 bg-gray-200 text-gray-700 rounded-full active:bg-gray-300 transition-colors"
            aria-label="Refresh feed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center mt-12 gap-3">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            <p className="text-gray-500 font-bold text-sm">Loading feed...</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center mt-12 bg-white p-8 rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <span className="text-4xl block mb-2 opacity-50">📰</span>
            <p className="text-gray-500 font-bold text-lg">No updates yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Be the first to share an update!
            </p>
          </div>
        )}

        {/* ── Post Cards ── */}
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${theme.activeBg} ${theme.activeText} rounded-full flex items-center justify-center font-black text-sm shadow-inner`}
                >
                  {getInitials(post.authorName)}
                </div>
                <h2 className="font-bold text-gray-900 text-[15px]">
                  {post.authorName}
                </h2>
              </div>
              <span className="text-xs font-semibold text-gray-400">
                {timeAgo(post.createdAt)}
              </span>
            </div>

            {/* Media */}
            {post.mediaType === "image" && post.mediaUrl && (
              <div className="px-4">
                <img
                  src={post.mediaUrl}
                  alt="Post attachment"
                  className="w-full h-auto max-h-72 object-cover rounded-xl border border-gray-100 shadow-sm"
                />
              </div>
            )}
            {post.mediaType === "video" && post.mediaUrl && (
              <div className="px-4">
                <video
                  src={post.mediaUrl}
                  controls
                  playsInline
                  muted
                  loop
                  className="w-full h-auto max-h-72 object-cover rounded-xl border border-gray-100 shadow-sm bg-black"
                />
              </div>
            )}

            {/* Body */}
            <div className="p-4 pt-3">
              <p className="text-gray-800 leading-relaxed text-[15px] break-words whitespace-pre-wrap">
                {post.description}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  post.isLikedByMe
                    ? `${theme.activeBg} ${theme.activeText}`
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={post.isLikedByMe ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {post.likesCount}
              </button>

              <button
                onClick={() => handleShare(post)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-gray-500 bg-white border border-gray-200 transition-all active:scale-95 hover:bg-gray-50 ${theme.textHover}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ═══ Floating Action Button ═══ */}
      <button
        onClick={() => setShowModal(true)}
        className={`fixed bottom-24 right-5 md:right-auto md:left-1/2 md:translate-x-[calc(224px-28px)] w-14 h-14 ${theme.bg} text-white rounded-full shadow-lg flex items-center justify-center text-3xl active:scale-90 transition-all z-30`}
        aria-label="Create a new post"
      >
        +
      </button>

      {/* ═══ Create Post Modal ═══ */}
      {showModal && (
        <CreatePostModal
          theme={theme}
          onClose={() => setShowModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// CREATE POST MODAL
// ═════════════════════════════════════════════════════════════════
function CreatePostModal({
  theme,
  onClose,
  onCreated,
}: {
  theme: (typeof themeStyles)[ThemeColor];
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaChange = (url: string, resourceType: string) => {
    setMediaUrl(url);
    setMediaType(resourceType === "video" ? "video" : "image");
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await apiClient.post("/feed", {
        description: description.trim(),
        mediaType: mediaUrl ? mediaType : null,
        mediaUrl: mediaUrl || null,
      });
      onCreated(res.data);
    } catch (err) {
      console.error("Failed to create post:", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center mb-16 justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">Create Update</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:bg-gray-200 transition-colors font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-5">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's happening on the ground?..."
            rows={4}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-gray-400 outline-none text-gray-900 font-medium text-[15px] resize-none transition-all placeholder-gray-400"
            autoFocus
          />

          <MediaUpload
            value={mediaUrl}
            onChange={handleMediaChange}
            disabled={isSubmitting}
            preset="evmpwa"
            label="Attach Photo or Video"
          />
        </div>

        {/* Modal Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className={`w-full h-14 ${theme.bg} text-white font-black text-lg rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-all shadow-md`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              "Post Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
