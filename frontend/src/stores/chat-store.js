import { create } from "zustand";
import { useAuthStore } from "./auth-store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://reddichat-backend-267146955755.us-east1.run.app";

export const useChatStore = create((set, get) => ({
  threads: [],
  currentThread: null,
  messages: [],
  isLoading: false,
  currentModel: "Gemini 2.5 Flash",

  // State for conversation ID
  conversationId: null,

  // Actions
  initializeConversation: () => {
    // Create a new thread without a specific ID - the server will assign one
    const newThread = {
      id: null, // Will be set by server on first message
      title: "New Chat",
      createdAt: new Date(),
      lastMessage: null,
    };

    set((state) => ({
      threads: [newThread, ...state.threads],
      currentThread: newThread,
      messages: [],
      conversationId: null, // Will be set by server on first message
    }));

    return newThread;
  },

  createNewThread: () => {
    // Always create a completely new thread
    return get().initializeConversation();
  },

  selectThread: (threadId) => {
    const { threads } = get();
    const thread = threads.find((t) => t.id === threadId);

    if (thread) {
      set({
        currentThread: thread,
        messages: thread.messages || [],
        conversationId: threadId,
      });
    }
  },

  // Load conversation from server with all messages
  loadConversation: async (conversationId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;

    try {
      set({ isLoading: true });

      // Fetch conversation details from server
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

      // Transform messages to match frontend expectations
      const transformedMessages = (conversationData.messages || []).map(
        (msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp), // Convert ISO string to Date object
          conversation_id: msg.conversation_id,
        })
      );

      // Create thread object from server data
      const thread = {
        id: conversationData.id,
        title: conversationData.title,
        createdAt: new Date(conversationData.created_at),
        lastMessage:
          transformedMessages.length > 0
            ? transformedMessages[transformedMessages.length - 1]
            : null,
        messages: transformedMessages,
      };

      // Update state with loaded conversation
      set((state) => {
        // Update or add thread to threads array
        const existingThreadIndex = state.threads.findIndex(
          (t) => t.id === conversationId
        );
        const updatedThreads =
          existingThreadIndex >= 0
            ? state.threads.map((t) => (t.id === conversationId ? thread : t))
            : [thread, ...state.threads];

        return {
          currentThread: thread,
          messages: thread.messages,
          conversationId: conversationId,
          threads: updatedThreads,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Error loading conversation:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Sync threads with API conversations
  syncThreadsWithAPI: (apiConversations) => {
    set((state) => {
      const syncedThreads = apiConversations.map((conv) => {
        // Find existing thread or create new one
        const existingThread = state.threads.find((t) => t.id === conv.id);

        return (
          existingThread || {
            id: conv.id,
            title: conv.title,
            createdAt: new Date(conv.created_at),
            lastMessage: null, // Will be loaded when conversation is selected
            messages: [], // Will be loaded when conversation is selected
          }
        );
      });

      return {
        ...state,
        threads: syncedThreads,
      };
    });
  },

  sendMessage: async (content) => {
    let { currentThread } = get();
    const { token } = useAuthStore.getState();

    if (!currentThread) {
      get().initializeConversation();
      // Get the updated currentThread after creating a new one
      currentThread = get().currentThread;
    }

    // Generate a UUID for the user message
    const userMessageId = crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    const userMessage = {
      id: userMessageId,
      content,
      role: "user",
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      // Make API call to backend with authentication
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          conversation_id: currentThread.id, // Can be null for new conversations
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update conversation ID from server response to ensure consistency
      const serverConversationId = data.conversation_id;

      // Generate a UUID for the AI message
      const aiMessageId = crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      const aiMessage = {
        id: aiMessageId,
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };

      set((state) => {
        // Update current thread and conversation ID to match server
        const updatedThread = state.currentThread
          ? {
              ...state.currentThread,
              id: serverConversationId,
              lastMessage: aiMessage,
              title:
                state.messages.length === 0
                  ? content
                  : state.currentThread.title,
            }
          : null;

        return {
          messages: [...state.messages, aiMessage],
          isLoading: false,
          conversationId: serverConversationId,
          currentThread: updatedThread,
          threads: state.threads.map((thread) =>
            thread.id === state.currentThread?.id ? updatedThread : thread
          ),
        };
      });

      // Refresh conversation list after sending message
      if (window.refreshConversationList) {
        window.refreshConversationList();
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Fallback to simulated response if API call fails
      setTimeout(() => {
        // Generate a UUID for the fallback AI message
        const fallbackAiMessageId = crypto.randomUUID
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
              /[xy]/g,
              function (c) {
                const r = (Math.random() * 16) | 0;
                const v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
              }
            );

        const aiMessage = {
          id: fallbackAiMessageId,
          content: "I'm a demo AI assistant. Your message was: " + content,
          role: "assistant",
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, aiMessage],
          isLoading: false,
        }));
      }, 1000);
    }
  },

  setCurrentModel: (model) => set({ currentModel: model }),

  toggleSettings: () => {
    console.log("Settings toggled");
  },

  deleteThread: (threadId) => {
    set((state) => ({
      threads: state.threads.filter((t) => t.id !== threadId),
      currentThread:
        state.currentThread?.id === threadId ? null : state.currentThread,
      messages: state.currentThread?.id === threadId ? [] : state.messages,
    }));
  },
}));
