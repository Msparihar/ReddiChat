"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  ArrowUp,
  User,
  Award,
  Play,
  FileText,
  Grid3X3,
  Loader2,
  Lock,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { useSession, signIn } from "@/lib/auth/client";

// ============ Types ============

interface RedditUser {
  name: string;
  id: string;
  created: string;
  linkKarma: number;
  commentKarma: number;
  totalKarma: number;
  isVerified: boolean;
  hasVerifiedEmail: boolean;
  iconImg: string;
  subreddit?: {
    title: string;
    description: string;
  };
}

interface MediaItem {
  url: string;
  width: number;
  height: number;
}

interface UserPost {
  id: string;
  fullname: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  numComments: number;
  created: string;
  permalink: string;
  url: string;
  isNsfw: boolean;
  thumbnail?: string;
  media: MediaItem[];
  isVideo: boolean;
  videoUrl?: string;
}

interface UserComment {
  id: string;
  fullname: string;
  body: string;
  subreddit: string;
  score: number;
  created: string;
  permalink: string;
  linkTitle: string;
}

type TabType = "posts" | "comments" | "media";

// ============ API Functions ============

async function fetchUserInfo(username: string) {
  const response = await fetch(`/api/reddit/user/${username}`);
  if (!response.ok) throw new Error("Failed to fetch user data");
  return response.json();
}

async function fetchUserPosts({ username, pageParam }: { username: string; pageParam?: string }) {
  const url = pageParam
    ? `/api/reddit/user/${username}/posts?after=${pageParam}`
    : `/api/reddit/user/${username}/posts`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch posts");
  return response.json();
}

async function fetchUserComments({ username, pageParam }: { username: string; pageParam?: string }) {
  const url = pageParam
    ? `/api/reddit/user/${username}/comments?after=${pageParam}`
    : `/api/reddit/user/${username}/comments`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch comments");
  return response.json();
}

// ============ Helper Functions ============

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatKarma(karma: number) {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
}

// ============ Components ============

function PostCard({ post, isDark }: { post: UserPost; isDark: boolean }) {
  const hasMedia = post.media && post.media.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200 shadow-sm"
      )}
    >
      {/* Post Header */}
      <div className="p-4">
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-orange-500">r/{post.subreddit}</span>
            {post.isNsfw && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">NSFW</span>
            )}
            {post.isVideo && (
              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                <Play size={10} /> Video
              </span>
            )}
          </div>
          <h3
            className={cn(
              "font-medium group-hover:text-orange-400 transition-colors",
              isDark ? "text-gray-200" : "text-gray-800"
            )}
          >
            {post.title}
          </h3>
          {post.selftext && (
            <p className={cn("text-sm mt-2 line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
              {post.selftext}
            </p>
          )}
        </a>
      </div>

      {/* Media - Show directly */}
      {hasMedia && (
        <div className={post.media.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
          {post.media.slice(0, 4).map((media, idx) => (
            <a
              key={idx}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block"
            >
              <img
                src={media.url}
                alt={`${post.title} - image ${idx + 1}`}
                className={cn(
                  "w-full object-cover",
                  post.media.length === 1 ? "max-h-[500px]" : "aspect-square"
                )}
                loading="lazy"
              />
              {idx === 3 && post.media.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{post.media.length - 4}</span>
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Post Footer */}
      <div className={cn("px-4 py-3 flex items-center gap-4 text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
        <span className="flex items-center gap-1">
          <ArrowUp size={14} />
          {post.score}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={14} />
          {post.numComments}
        </span>
        <span>{formatDate(post.created)}</span>
      </div>
    </div>
  );
}

function CommentCard({ comment, isDark }: { comment: UserComment; isDark: boolean }) {
  return (
    <a
      href={comment.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block rounded-xl p-4 border transition-all hover:border-orange-500/50",
        isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200 shadow-sm"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-orange-500">r/{comment.subreddit}</span>
      </div>
      <p className={cn("text-sm mb-2", isDark ? "text-gray-300" : "text-gray-700")}>{comment.body}</p>
      <p className={cn("text-xs line-clamp-1 mb-3", isDark ? "text-gray-500" : "text-gray-400")}>
        on: {comment.linkTitle}
      </p>
      <div className={cn("flex items-center gap-4 text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
        <span className="flex items-center gap-1">
          <ArrowUp size={14} />
          {comment.score}
        </span>
        <span>{formatDate(comment.created)}</span>
      </div>
    </a>
  );
}

function MediaGrid({ posts, isDark }: { posts: UserPost[]; isDark: boolean }) {
  // Filter posts that have media
  const postsWithMedia = posts.filter((p) => p.media && p.media.length > 0);

  if (postsWithMedia.length === 0) {
    return (
      <div className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-400")}>
        No media found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {postsWithMedia.map((post) => {
        const firstMedia = post.media[0];

        return (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square rounded-lg overflow-hidden group"
          >
            <img
              src={firstMedia.url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {post.media.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                <Grid3X3 size={12} />
                {post.media.length}
              </div>
            )}
            {post.isNsfw && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                NSFW
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs line-clamp-2">{post.title}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );
}

function LoginPrompt({ username, isDark }: { username: string; isDark: boolean }) {
  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: `/u/${username}`,
    });
  };

  const handleGitHubSignIn = async () => {
    await signIn.social({
      provider: "github",
      callbackURL: `/u/${username}`,
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-8 border text-center",
        isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200 shadow-lg"
      )}
    >
      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className={cn("text-lg font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
        Sign in to view content
      </h3>
      <p className={cn("text-sm mb-6", isDark ? "text-gray-400" : "text-gray-600")}>
        Sign in to view u/{username}'s posts, comments, and media
      </p>
      <div className="space-y-3">
        <button
          onClick={handleGoogleSignIn}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
            isDark
              ? "bg-white text-gray-900 hover:bg-gray-100"
              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={handleGitHubSignIn}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
            isDark
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-900 text-white hover:bg-gray-800"
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          Continue with GitHub
        </button>
      </div>
    </div>
  );
}

// ============ Main Component ============

export default function RedditUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending: sessionLoading } = useSession();
  const isAuthenticated = !!session?.user;

  // User info query
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["reddit-user", resolvedParams.username],
    queryFn: () => fetchUserInfo(resolvedParams.username),
  });

  // Posts infinite query - only fetch when authenticated
  const {
    data: postsData,
    fetchNextPage: fetchMorePosts,
    hasNextPage: hasMorePosts,
    isFetchingNextPage: loadingMorePosts,
    isLoading: postsLoading,
  } = useInfiniteQuery({
    queryKey: ["reddit-user-posts", resolvedParams.username],
    queryFn: ({ pageParam }) => fetchUserPosts({ username: resolvedParams.username, pageParam }),
    getNextPageParam: (lastPage) => lastPage.after,
    initialPageParam: undefined as string | undefined,
    enabled: isAuthenticated,
  });

  // Comments infinite query - only fetch when authenticated
  const {
    data: commentsData,
    fetchNextPage: fetchMoreComments,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: loadingMoreComments,
    isLoading: commentsLoading,
  } = useInfiniteQuery({
    queryKey: ["reddit-user-comments", resolvedParams.username],
    queryFn: ({ pageParam }) => fetchUserComments({ username: resolvedParams.username, pageParam }),
    getNextPageParam: (lastPage) => lastPage.after,
    initialPageParam: undefined as string | undefined,
    enabled: isAuthenticated && activeTab === "comments",
  });

  // Flatten paginated data
  const allPosts = postsData?.pages.flatMap((page) => page.items) || [];
  const allComments = commentsData?.pages.flatMap((page) => page.items) || [];

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        if (activeTab === "posts" && hasMorePosts && !loadingMorePosts) {
          fetchMorePosts();
        } else if (activeTab === "comments" && hasMoreComments && !loadingMoreComments) {
          fetchMoreComments();
        } else if (activeTab === "media" && hasMorePosts && !loadingMorePosts) {
          fetchMorePosts();
        }
      }
    },
    [activeTab, hasMorePosts, hasMoreComments, loadingMorePosts, loadingMoreComments, fetchMorePosts, fetchMoreComments]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  // Loading state
  if (userLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-gray-950" : "bg-gray-50")}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Error state
  if (userError || userData?.error) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-4", isDark ? "bg-gray-950" : "bg-gray-50")}>
        <p className={cn("text-lg mb-4", isDark ? "text-gray-300" : "text-gray-600")}>
          {userData?.error || "Failed to load user data"}
        </p>
        <Link href="/" className="flex items-center gap-2 text-orange-500 hover:text-orange-400">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  const user = userData?.user as RedditUser;

  const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
    { id: "posts", label: "Posts", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "media", label: "Media", icon: Grid3X3 },
  ];

  return (
    <div
      className={cn(
        "min-h-screen",
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      )}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-2 mb-4 hover:text-orange-400 transition-colors text-sm",
            isDark ? "text-gray-400" : "text-gray-600"
          )}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* User Header - Compact */}
        <div
          className={cn(
            "rounded-2xl p-5 mb-4 border",
            isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200 shadow-lg"
          )}
        >
          <div className="flex items-center gap-4">
            {user?.iconImg ? (
              <img
                src={user.iconImg.split("?")[0]}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className={cn("text-xl font-bold truncate", isDark ? "text-white" : "text-gray-900")}>
                u/{user?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className={cn("text-sm flex items-center gap-1", isDark ? "text-gray-400" : "text-gray-600")}>
                  <Calendar size={12} />
                  {formatDate(user?.created || "")}
                </span>
                <span className={cn("text-sm flex items-center gap-1", isDark ? "text-gray-400" : "text-gray-600")}>
                  <Award size={12} />
                  {formatKarma(user?.totalKarma || 0)} karma
                </span>
              </div>
            </div>
          </div>

          {/* Karma Stats - Inline */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
            <div className="flex-1 text-center">
              <div className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                {formatKarma(user?.linkKarma || 0)}
              </div>
              <div className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>Post Karma</div>
            </div>
            <div className="flex-1 text-center">
              <div className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                {formatKarma(user?.commentKarma || 0)}
              </div>
              <div className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>Comment Karma</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={cn(
            "flex rounded-xl p-1 mb-4 border",
            isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"
          )}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-orange-500 text-white"
                  : isDark
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Show login prompt if not authenticated */}
          {!isAuthenticated && !sessionLoading ? (
            <LoginPrompt username={resolvedParams.username} isDark={isDark} />
          ) : sessionLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === "posts" && (
                <>
                  {postsLoading ? (
                    <LoadingSpinner />
                  ) : allPosts.length > 0 ? (
                    allPosts.map((post) => <PostCard key={post.id} post={post} isDark={isDark} />)
                  ) : (
                    <div className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-400")}>
                      No posts found
                    </div>
                  )}
                  {loadingMorePosts && <LoadingSpinner />}
                </>
              )}

              {activeTab === "comments" && (
                <>
                  {commentsLoading ? (
                    <LoadingSpinner />
                  ) : allComments.length > 0 ? (
                    allComments.map((comment) => <CommentCard key={comment.id} comment={comment} isDark={isDark} />)
                  ) : (
                    <div className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-400")}>
                      No comments found
                    </div>
                  )}
                  {loadingMoreComments && <LoadingSpinner />}
                </>
              )}

              {activeTab === "media" && (
                <>
                  {postsLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <MediaGrid posts={allPosts} isDark={isDark} />
                  )}
                  {loadingMorePosts && <LoadingSpinner />}
                </>
              )}
            </>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-4" />

          {/* End of content message */}
          {((activeTab === "posts" && !hasMorePosts && allPosts.length > 0) ||
            (activeTab === "comments" && !hasMoreComments && allComments.length > 0) ||
            (activeTab === "media" && !hasMorePosts && allPosts.some((p) => p.media?.length > 0))) && (
            <div className={cn("text-center py-4 text-sm", isDark ? "text-gray-600" : "text-gray-400")}>
              You've reached the end
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
