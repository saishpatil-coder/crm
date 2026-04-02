import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

// Helper for initials
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Relative time helper
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface Props {
  params: { id: string };
}

// SEO Tags Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { id: parseInt(params.id, 10) },
    include: { author: true, tenant: true },
  });

  if (!post) {
    return { title: "Post Not Found" };
  }

  const title = `Update from ${post.author.name}`;
  const description = post.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: post.mediaUrl && post.mediaType === "image" ? [post.mediaUrl] : [],
    },
  };
}

export default async function PublicPostPage({ params }: Props) {
  const postId = parseInt(params.id, 10);
  if (isNaN(postId)) return notFound();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { 
      author: true,
      tenant: true,
      _count: {
        select: { likes: true }
      }
    },
  });

  if (!post) {
    return notFound();
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col md:items-center">
      {/* Dynamic Header imitating the CRM header */}
      <header className="w-full bg-blue-600 shadow-md sticky top-0 z-50">
        <div className="md:max-w-xl md:mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-xl tracking-widest bg-white/20 px-2 py-0.5 rounded">
              EVM
            </span>
          </div>
          <div className="flex items-center gap-2">
            {post.tenant?.partyLogoUrl && (
              <img 
                src={post.tenant.partyLogoUrl} 
                alt="Party Logo" 
                className="w-8 h-8 rounded-full object-cover bg-white/20 p-0.5" 
              />
            )}
            <div className="flex flex-col items-end">
              <h1 className="text-lg text-white font-black tracking-widest uppercase leading-none truncate max-w-[150px]">
                {post.tenant?.partyName || "CAMPAIGN"}
              </h1>
              {post.tenant?.candidateName && (
                <span className="text-[10px] font-bold text-white/80 tracking-wider truncate max-w-[150px]">
                  {post.tenant.candidateName}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full md:max-w-xl md:mx-auto p-4 md:py-8">
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-lg shadow-inner">
                {getInitials(post.author.name)}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-gray-900 text-[16px] leading-snug">
                  {post.author.name}
                </h2>
                <span className="text-xs font-semibold text-gray-400">
                  {timeAgo(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Media Content */}
          {post.mediaType === "image" && post.mediaUrl && (
            <div className="px-5 pt-5 pb-2">
              <img
                src={post.mediaUrl}
                alt="Campaign Update"
                className="w-full h-auto max-h-[50vh] object-contain rounded-xl border border-gray-100 shadow-sm bg-gray-50"
              />
            </div>
          )}
          {post.mediaType === "video" && post.mediaUrl && (
            <div className="px-5 pt-5 pb-2">
              <video
                src={post.mediaUrl}
                controls
                playsInline
                className="w-full h-auto max-h-[50vh] object-cover rounded-xl border border-gray-100 shadow-sm bg-black"
              />
            </div>
          )}

          {/* Text Content */}
          <div className="p-5 pt-3">
            <p className="text-gray-800 leading-relaxed text-[16px] break-words whitespace-pre-wrap font-medium">
              {post.description}
            </p>
          </div>

          {/* Footer Metrics */}
          <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 font-black">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {post._count.likes} Likes
            </div>
            
            {/* CTA for public users */}
            <Link 
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow active:scale-95 transition-all"
            >
              Join Campaign
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
