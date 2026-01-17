// Reddit API client using direct fetch (similar to PRAW's approach)

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Reddit API credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ReddiChat:v2.0 (by /u/reddichat)",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      device_id: "DO_NOT_TRACK_THIS_DEVICE",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Reddit token error:", response.status, text);
    throw new Error(`Failed to get Reddit access token: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Refresh 60 seconds before expiry
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return accessToken!;
}

async function redditFetch(endpoint: string): Promise<any> {
  const token = await getAccessToken();

  const response = await fetch(`https://oauth.reddit.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "ReddiChat:v2.0 (by /u/reddichat)",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Reddit API error: ${response.status} - ${text}`);
  }

  return response.json();
}

// ============ Types ============

export interface RedditPost {
  title: string;
  text: string;
  url: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  createdUtc: string;
  permalink: string;
  isNsfw: boolean;
}

export interface RedditSearchResult {
  query: string;
  resultsCount: number;
  posts: RedditPost[];
  searchParams: {
    subreddits: string[];
    timeFilter: string;
    limit: number;
  };
  error?: string;
}

export interface RedditUser {
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

export interface MediaItem {
  url: string;
  width: number;
  height: number;
}

export interface UserPost {
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

export interface UserComment {
  id: string;
  fullname: string;
  body: string;
  subreddit: string;
  score: number;
  created: string;
  permalink: string;
  linkTitle: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  after: string | null;
  hasMore: boolean;
}

// ============ Search Reddit ============

export async function searchReddit(
  query: string,
  subreddits?: string[],
  limit: number = 5,
  timeFilter: "day" | "week" | "month" | "year" | "all" = "month"
): Promise<RedditSearchResult> {
  try {
    const actualLimit = Math.min(limit, 10);
    const subredditPath = subreddits?.length ? subreddits.join("+") : "all";

    const params = new URLSearchParams({
      q: query,
      sort: "relevance",
      t: timeFilter,
      limit: actualLimit.toString(),
      restrict_sr: subreddits?.length ? "true" : "false",
    });

    const data = await redditFetch(`/r/${subredditPath}/search?${params}`);

    const posts: RedditPost[] = data.data.children.map((child: any) => {
      const submission = child.data;
      const createdDate = new Date(submission.created_utc * 1000);
      let textContent = submission.selftext || "";
      if (textContent.length > 300) {
        textContent = textContent.substring(0, 300) + "...";
      } else if (!textContent) {
        textContent = "[No text content; this is a link post]";
      }

      return {
        title: submission.title,
        text: textContent,
        url: submission.url,
        subreddit: submission.subreddit,
        author: submission.author || "[Deleted]",
        score: submission.score,
        numComments: submission.num_comments,
        createdUtc: createdDate.toISOString(),
        permalink: `https://www.reddit.com${submission.permalink}`,
        isNsfw: submission.over_18,
      };
    });

    return {
      query,
      resultsCount: posts.length,
      posts,
      searchParams: {
        subreddits: subreddits || ["all"],
        timeFilter,
        limit: actualLimit,
      },
    };
  } catch (error: any) {
    console.error("Reddit search error:", error);

    if (error.message?.includes("rate limit")) {
      return {
        query,
        resultsCount: 0,
        posts: [],
        searchParams: {
          subreddits: subreddits || ["all"],
          timeFilter,
          limit,
        },
        error:
          "Reddit API rate limit exceeded. Please try again in a few minutes.",
      };
    }

    return {
      query,
      resultsCount: 0,
      posts: [],
      searchParams: {
        subreddits: subreddits || ["all"],
        timeFilter,
        limit,
      },
      error: `Reddit search failed: ${error.message}`,
    };
  }
}

// ============ Get User Info Only ============

export async function getRedditUserInfo(
  username: string
): Promise<{ user: RedditUser; error?: string }> {
  try {
    const userResponse = await redditFetch(`/user/${username}/about`);
    const userData = userResponse.data;

    const user: RedditUser = {
      name: userData.name,
      id: userData.id,
      created: new Date(userData.created_utc * 1000).toISOString(),
      linkKarma: userData.link_karma || 0,
      commentKarma: userData.comment_karma || 0,
      totalKarma: (userData.link_karma || 0) + (userData.comment_karma || 0),
      isVerified: userData.verified || false,
      hasVerifiedEmail: userData.has_verified_email || false,
      iconImg: userData.icon_img || "",
      subreddit: userData.subreddit
        ? {
            title: userData.subreddit.title || "",
            description: userData.subreddit.public_description || "",
          }
        : undefined,
    };

    return { user };
  } catch (error: any) {
    console.error("Reddit user fetch error:", error);
    return {
      user: {} as RedditUser,
      error: error.message || "Failed to fetch user data",
    };
  }
}

// ============ Helper: Extract Media from Post ============

function extractMediaFromPost(post: any): MediaItem[] {
  const media: MediaItem[] = [];

  // 1. Check for gallery posts (multiple images)
  if (post.is_gallery && post.media_metadata) {
    const galleryItems = post.gallery_data?.items || [];
    for (const item of galleryItems) {
      const mediaId = item.media_id;
      const metadata = post.media_metadata[mediaId];
      if (metadata && metadata.s) {
        const imageUrl = (metadata.s.u || metadata.s.gif || "").replace(
          /&amp;/g,
          "&"
        );
        if (imageUrl) {
          media.push({
            url: imageUrl,
            width: metadata.s.x || 0,
            height: metadata.s.y || 0,
          });
        }
      }
    }
  }

  // 2. Check preview images (single image posts)
  if (media.length === 0 && post.preview?.images) {
    for (const image of post.preview.images) {
      const source = image.source;
      if (source?.url) {
        media.push({
          url: source.url.replace(/&amp;/g, "&"),
          width: source.width || 0,
          height: source.height || 0,
        });
      }
    }
  }

  // 3. Check if URL is a direct image link
  if (media.length === 0 && post.url) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const urlLower = post.url.toLowerCase();
    if (imageExtensions.some((ext) => urlLower.includes(ext))) {
      media.push({
        url: post.url,
        width: 0,
        height: 0,
      });
    }
  }

  return media;
}

// ============ Get User Posts (Paginated) ============

export async function getUserPosts(
  username: string,
  after?: string,
  limit: number = 15
): Promise<PaginatedResponse<UserPost> & { error?: string }> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort: "new",
    });
    if (after) {
      params.set("after", after);
    }

    const response = await redditFetch(
      `/user/${username}/submitted?${params}`
    );

    const posts: UserPost[] = response.data.children.map((child: any) => {
      const post = child.data;
      const media = extractMediaFromPost(post);

      const validThumbnail =
        post.thumbnail &&
        !["self", "default", "nsfw", "spoiler", "image", ""].includes(
          post.thumbnail
        ) &&
        post.thumbnail.startsWith("http");

      const isVideo = post.is_video || false;
      const videoUrl =
        post.media?.reddit_video?.fallback_url ||
        post.secure_media?.reddit_video?.fallback_url;

      return {
        id: post.id,
        fullname: post.name, // t3_xxxxx format for pagination
        title: post.title,
        selftext:
          post.selftext?.length > 200
            ? post.selftext.substring(0, 200) + "..."
            : post.selftext || "",
        subreddit: post.subreddit,
        score: post.score,
        numComments: post.num_comments,
        created: new Date(post.created_utc * 1000).toISOString(),
        permalink: `https://www.reddit.com${post.permalink}`,
        url: post.url,
        isNsfw: post.over_18,
        thumbnail: validThumbnail ? post.thumbnail : undefined,
        media,
        isVideo,
        videoUrl,
      };
    });

    return {
      items: posts,
      after: response.data.after,
      hasMore: !!response.data.after,
    };
  } catch (error: any) {
    console.error("Reddit user posts fetch error:", error);
    return {
      items: [],
      after: null,
      hasMore: false,
      error: error.message || "Failed to fetch posts",
    };
  }
}

// ============ Get User Comments (Paginated) ============

export async function getUserComments(
  username: string,
  after?: string,
  limit: number = 15
): Promise<PaginatedResponse<UserComment> & { error?: string }> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort: "new",
    });
    if (after) {
      params.set("after", after);
    }

    const response = await redditFetch(`/user/${username}/comments?${params}`);

    const comments: UserComment[] = response.data.children.map((child: any) => {
      const comment = child.data;
      return {
        id: comment.id,
        fullname: comment.name, // t1_xxxxx format for pagination
        body:
          comment.body?.length > 300
            ? comment.body.substring(0, 300) + "..."
            : comment.body || "",
        subreddit: comment.subreddit,
        score: comment.score,
        created: new Date(comment.created_utc * 1000).toISOString(),
        permalink: `https://www.reddit.com${comment.permalink}`,
        linkTitle: comment.link_title || "",
      };
    });

    return {
      items: comments,
      after: response.data.after,
      hasMore: !!response.data.after,
    };
  } catch (error: any) {
    console.error("Reddit user comments fetch error:", error);
    return {
      items: [],
      after: null,
      hasMore: false,
      error: error.message || "Failed to fetch comments",
    };
  }
}

// ============ Legacy: Get Full User Data (for backwards compatibility) ============

export interface RedditUserData {
  user: RedditUser;
  posts: UserPost[];
  comments: UserComment[];
  error?: string;
}

export async function getRedditUser(
  username: string
): Promise<RedditUserData> {
  try {
    const [userResult, postsResult, commentsResult] = await Promise.all([
      getRedditUserInfo(username),
      getUserPosts(username, undefined, 10),
      getUserComments(username, undefined, 10),
    ]);

    if (userResult.error) {
      return {
        user: {} as RedditUser,
        posts: [],
        comments: [],
        error: userResult.error,
      };
    }

    return {
      user: userResult.user,
      posts: postsResult.items,
      comments: commentsResult.items,
    };
  } catch (error: any) {
    console.error("Reddit user fetch error:", error);
    return {
      user: {} as RedditUser,
      posts: [],
      comments: [],
      error: error.message || "Failed to fetch user data",
    };
  }
}
