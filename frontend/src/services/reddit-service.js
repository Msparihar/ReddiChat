const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

class RedditService {
  static async getUserHistory(username, options = {}) {
    const {
      contentType = "all",
      limit = 100,
      sort = "new",
      afterPost = null,
      afterComment = null,
    } = options;

    const params = new URLSearchParams({
      content_type: contentType,
      limit: limit.toString(),
      sort,
    });

    if (afterPost) params.append("after_post", afterPost);
    if (afterComment) params.append("after_comment", afterComment);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/reddit/user/${encodeURIComponent(username)}?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export default RedditService;
