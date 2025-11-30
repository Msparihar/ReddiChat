const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

class AuthService {
  // Get current user info (cookie-based)
  static async getCurrentUser() {
    try {
      console.log("=== AuthService.getCurrentUser called ===");
      console.log("API_BASE_URL:", API_BASE_URL);
      console.log("Document cookies:", document.cookie);
      console.log(
        "Cookies available:",
        document.cookie.split(";").map((c) => c.trim())
      );

      const requestHeaders = {
        "Content-Type": "application/json",
      };
      console.log("Request headers:", requestHeaders);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: requestHeaders,
        credentials: "include", // Include cookies for cross-site requests
      });

      console.log("getCurrentUser response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  // Logout user (cookie-based)
  static async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for cross-site requests
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  // Get user's conversation history (cookie-based)
  static async getConversationHistory(page = 1, size = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/conversations?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for cross-site requests
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const historyData = await response.json();
      return historyData;
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      throw error;
    }
  }

  // Get conversation details
  static async getConversationDetails(conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/conversations/${conversationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for cross-site requests
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const conversationData = await response.json();
      return conversationData;
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      throw error;
    }
  }

  // Delete conversation
  static async deleteConversation(conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for cross-site requests
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }
}

export default AuthService;
