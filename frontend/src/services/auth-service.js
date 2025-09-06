const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class AuthService {
  // Get current user info
  static async getCurrentUser(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

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

  // Logout user
  static async logout(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  // Get user's conversation history
  static async getConversationHistory(token, page = 1, size = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/conversations?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
  static async getConversationDetails(token, conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/conversations/${conversationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
  static async deleteConversation(token, conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
