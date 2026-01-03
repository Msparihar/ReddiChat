import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ArrowBigUp,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Bot,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import RedditService from '../services/reddit-service';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CollapsibleItem = ({ item, type, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPost = type === 'post';

  const title = isPost ? item.title : item.post_title;
  const content = isPost ? item.text : item.body;
  const hasContent = content && content.length > 0;

  return (
    <div
      className={cn(
        "group border-b transition-all duration-200",
        isDark ? "border-gray-800/50" : "border-gray-200/80",
        isExpanded && (isDark ? "bg-gray-800/30" : "bg-orange-50/50")
      )}
    >
      <button
        onClick={() => hasContent && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors",
          hasContent && "cursor-pointer",
          !hasContent && "cursor-default",
          isDark ? "hover:bg-gray-800/40" : "hover:bg-gray-50"
        )}
      >
        {/* Expand icon */}
        <div className={cn(
          "mt-0.5 transition-transform duration-200 flex-shrink-0",
          !hasContent && "opacity-0"
        )}>
          {isExpanded ? (
            <ChevronDown size={16} className={isDark ? "text-orange-400" : "text-orange-600"} />
          ) : (
            <ChevronRight size={16} className={isDark ? "text-gray-500" : "text-gray-400"} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title / Preview */}
          <div className={cn(
            "font-medium line-clamp-2 leading-snug",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            {isPost ? (
              title
            ) : (
              <span className={cn(
                "font-normal",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                {content.length > 150 ? content.slice(0, 150) + '...' : content}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className={cn(
            "flex items-center gap-3 mt-1.5 text-xs flex-wrap",
            isDark ? "text-gray-500" : "text-gray-500"
          )}>
            <span className={cn(
              "font-medium",
              isDark ? "text-orange-400/80" : "text-orange-600"
            )}>
              r/{item.subreddit}
            </span>
            <span className="flex items-center gap-1">
              <ArrowBigUp size={14} />
              {item.score.toLocaleString()}
            </span>
            {isPost && (
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                {item.num_comments}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(item.created_utc)}
            </span>
            {!isPost && item.post_title && (
              <span className={cn(
                "hidden sm:block truncate max-w-[200px]",
                isDark ? "text-gray-600" : "text-gray-400"
              )}>
                on: {item.post_title}
              </span>
            )}
          </div>
        </div>

        {/* External link */}
        <a
          href={item.permalink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex-shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all",
            isDark
              ? "hover:bg-gray-700 text-gray-400 hover:text-orange-400"
              : "hover:bg-gray-200 text-gray-400 hover:text-orange-600"
          )}
        >
          <ExternalLink size={14} />
        </a>
      </button>

      {/* Expanded content */}
      {isExpanded && hasContent && (
        <div className={cn(
          "px-4 pb-4 pl-11 animate-in slide-in-from-top-2 duration-200",
        )}>
          <div className={cn(
            "p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap",
            isDark ? "bg-gray-900/80 text-gray-300" : "bg-white text-gray-700 shadow-sm border border-gray-100"
          )}>
            {content}
          </div>
          {isPost && item.url && !item.is_self && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 mt-3 text-sm font-medium transition-colors",
                isDark ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"
              )}
            >
              <ExternalLink size={14} />
              View linked content
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const CollapsibleSection = ({ title, icon, count, children, defaultOpen = true, isDark, hasMore, onLoadMore, loadingMore }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const IconComponent = icon;

  return (
    <div className={cn(
      "rounded-xl overflow-hidden border",
      isDark ? "bg-gray-900/50 border-gray-800/50" : "bg-white border-gray-200 shadow-sm"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between transition-colors",
          isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isDark ? "bg-orange-500/10" : "bg-orange-100"
          )}>
            <IconComponent size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
          </div>
          <span className={cn(
            "font-semibold",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            {title}
          </span>
          <span className={cn(
            "text-sm px-2 py-0.5 rounded-full",
            isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
          )}>
            {count}{hasMore ? '+' : ''}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={cn(
            "transition-transform duration-200",
            isDark ? "text-gray-500" : "text-gray-400",
            !isOpen && "-rotate-90"
          )}
        />
      </button>

      {isOpen && (
        <div className={cn(
          "border-t",
          isDark ? "border-gray-800/50" : "border-gray-100"
        )}>
          {children}
          {hasMore && (
            <div className="p-3 flex justify-center">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                  isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  "disabled:opacity-50"
                )}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    Load More
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RedditUserPage = () => {
  const { username: urlUsername } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [searchInput, setSearchInput] = useState(urlUsername || '');
  const [username, setUsername] = useState(urlUsername || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserHistory = useCallback(async (user) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await RedditService.getUserHistory(user, { limit: 100 });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!data || !data.after_post || loadingMorePosts) return;

    setLoadingMorePosts(true);
    try {
      const result = await RedditService.getUserHistory(username, {
        limit: 100,
        contentType: 'posts',
        afterPost: data.after_post,
      });
      setData(prev => ({
        ...prev,
        posts: [...prev.posts, ...result.posts],
        has_more_posts: result.has_more_posts,
        after_post: result.after_post,
      }));
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMorePosts(false);
    }
  }, [data, username, loadingMorePosts]);

  const loadMoreComments = useCallback(async () => {
    if (!data || !data.after_comment || loadingMoreComments) return;

    setLoadingMoreComments(true);
    try {
      const result = await RedditService.getUserHistory(username, {
        limit: 100,
        contentType: 'comments',
        afterComment: data.after_comment,
      });
      setData(prev => ({
        ...prev,
        comments: [...prev.comments, ...result.comments],
        has_more_comments: result.has_more_comments,
        after_comment: result.after_comment,
      }));
    } catch (err) {
      console.error('Error loading more comments:', err);
    } finally {
      setLoadingMoreComments(false);
    }
  }, [data, username, loadingMoreComments]);

  useEffect(() => {
    if (urlUsername) {
      setSearchInput(urlUsername);
      setUsername(urlUsername);
      fetchUserHistory(urlUsername);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlUsername]);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanUsername = searchInput.trim().replace(/^u\//, '');
    if (cleanUsername) {
      setUsername(cleanUsername);
      navigate(`/u/${cleanUsername}`, { replace: true });
      fetchUserHistory(cleanUsername);
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      isDark
        ? "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"
        : "bg-gradient-to-b from-gray-50 via-white to-gray-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b",
        isDark
          ? "bg-gray-950/80 border-gray-800/50"
          : "bg-white/80 border-gray-200/50"
      )}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 group",
            )}
          >
            <div className="p-1.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg group-hover:scale-105 transition-transform">
              <Bot size={20} className="text-white" />
            </div>
            <span className={cn(
              "font-bold hidden sm:block",
              isDark ? "text-white" : "text-gray-900"
            )}>
              ReddiChat
            </span>
          </Link>

          <div className={cn(
            "h-6 w-px",
            isDark ? "bg-gray-800" : "bg-gray-200"
          )} />

          <div className="flex items-center gap-2">
            <User size={16} className={isDark ? "text-orange-400" : "text-orange-600"} />
            <span className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              User History
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search section */}
        <div className="mb-8">
          <h1 className={cn(
            "text-2xl sm:text-3xl font-bold mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Reddit User Lookup
          </h1>
          <p className={cn(
            "text-sm mb-6",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            View any Reddit user's public posts and comments history
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className={cn(
              "flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border transition-all",
              isDark
                ? "bg-gray-900/50 border-gray-800 focus-within:border-orange-500/50 focus-within:bg-gray-900"
                : "bg-white border-gray-200 focus-within:border-orange-500 focus-within:shadow-sm"
            )}>
              <span className={isDark ? "text-gray-500" : "text-gray-400"}>u/</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter username..."
                className={cn(
                  "flex-1 bg-transparent outline-none text-base",
                  isDark
                    ? "text-white placeholder:text-gray-600"
                    : "text-gray-900 placeholder:text-gray-400"
                )}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className={cn(
                "px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all",
                "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
                "hover:from-orange-600 hover:to-orange-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>

        {/* Error state */}
        {error && (
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-xl mb-6",
            isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
          )}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 size={32} className={cn(
              "animate-spin",
              isDark ? "text-orange-400" : "text-orange-600"
            )} />
            <span className={isDark ? "text-gray-400" : "text-gray-600"}>
              Fetching history for u/{username}...
            </span>
          </div>
        )}

        {/* Results */}
        {!loading && data && (
          <div className="space-y-6">
            {/* User header */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              isDark ? "bg-gray-800/50" : "bg-orange-50"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold",
                "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
              )}>
                {data.username[0].toUpperCase()}
              </div>
              <div>
                <h2 className={cn(
                  "font-bold text-lg",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  u/{data.username}
                </h2>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {data.posts.length}{data.has_more_posts ? '+' : ''} posts · {data.comments.length}{data.has_more_comments ? '+' : ''} comments loaded
                </p>
              </div>
            </div>

            {/* Curated profile notice */}
            {data.used_search_fallback && (
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl text-sm",
                isDark ? "bg-yellow-500/10 text-yellow-300" : "bg-yellow-50 text-yellow-800"
              )}>
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">This user has a curated profile</p>
                  <p className={cn(
                    "mt-1",
                    isDark ? "text-yellow-400/70" : "text-yellow-700"
                  )}>
                    Posts were found via search. Comments are not available for curated profiles.
                  </p>
                </div>
              </div>
            )}

            {/* Posts section */}
            {data.posts.length > 0 && (
              <CollapsibleSection
                title="Posts"
                icon={FileText}
                count={data.posts.length}
                isDark={isDark}
                hasMore={data.has_more_posts}
                onLoadMore={loadMorePosts}
                loadingMore={loadingMorePosts}
              >
                {data.posts.map((post) => (
                  <CollapsibleItem
                    key={post.id}
                    item={post}
                    type="post"
                    isDark={isDark}
                  />
                ))}
              </CollapsibleSection>
            )}

            {/* Comments section */}
            {data.comments.length > 0 && (
              <CollapsibleSection
                title="Comments"
                icon={MessageSquare}
                count={data.comments.length}
                isDark={isDark}
                hasMore={data.has_more_comments}
                onLoadMore={loadMoreComments}
                loadingMore={loadingMoreComments}
              >
                {data.comments.map((comment) => (
                  <CollapsibleItem
                    key={comment.id}
                    item={comment}
                    type="comment"
                    isDark={isDark}
                  />
                ))}
              </CollapsibleSection>
            )}

            {/* Empty states */}
            {data.posts.length === 0 && data.comments.length === 0 && (
              <div className={cn(
                "text-center py-12",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                No public posts or comments found for this user.
              </div>
            )}
          </div>
        )}

        {/* Empty state - no search yet */}
        {!loading && !data && !error && (
          <div className={cn(
            "text-center py-16",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p>Enter a Reddit username to view their history</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default RedditUserPage;
