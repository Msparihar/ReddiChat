import { create } from "zustand";
import { useAuthStore } from "./auth-store";
import {
  generateUUID,
  parseSSEStream,
  handleStreamError,
  debounce,
  createTimeout,
  validateSSEEvent,
} from "../lib/streaming";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://reddichat-backend-267146955755.us-east1.run.app";

export const useChatStore = create((set, get) => ({
  threads: [],
  currentThread: null,
  messages: [],
  isLoading: false,

  // State for conversation ID
  conversationId: null,

  // Streaming state
  isStreaming: false,
  pendingMessage: null,
  currentTool: null,

  // Error recovery state
  failedMessage: null,
  retryCount: 0,
  maxRetries: 3,

  // Streaming helper functions
  startStreaming: (pendingMessage) => {
    set({
      isStreaming: true,
      pendingMessage,
      currentTool: null,
    });
  },

  updateStreamingContent: (delta) => {
    set((state) => {
      if (!state.pendingMessage) return state;

      return {
        pendingMessage: {
          ...state.pendingMessage,
          content: state.pendingMessage.content + delta,
        },
        messages: state.messages.map((msg) =>
          msg.id === state.pendingMessage.id
            ? { ...msg, content: msg.content + delta }
            : msg
        ),
      };
    });
  },

  updateCurrentTool: (tool) => {
    set({ currentTool: tool });
  },

  finishStreaming: (finalMessage) => {
    set((state) => {
      const updatedMessages = state.messages.map((msg) =>
        msg.id === state.pendingMessage?.id ? finalMessage : msg
      );

      return {
        isStreaming: false,
        pendingMessage: null,
        currentTool: null,
        messages: updatedMessages,
        isLoading: false,
      };
    });
  },

  handleStreamError: (errorMessage, canRetry = true) => {
    set((state) => {
      const errorMessageObj = {
        id: state.pendingMessage?.id || generateUUID(),
        content: errorMessage,
        role: "assistant",
        timestamp: new Date(),
        sources: [],
        tool_used: null,
        has_attachments: false,
        file_attachments: [],
        isError: true,
        canRetry: canRetry && state.retryCount < state.maxRetries,
        retryCount: state.retryCount,
      };

      const updatedMessages = state.pendingMessage
        ? state.messages.map((msg) =>
            msg.id === state.pendingMessage.id ? errorMessageObj : msg
          )
        : [...state.messages, errorMessageObj];

      return {
        isStreaming: false,
        pendingMessage: null,
        currentTool: null,
        messages: updatedMessages,
        isLoading: false,
        failedMessage: canRetry ? state.pendingMessage : null,
      };
    });
  },

  retryFailedMessage: async () => {
    const { failedMessage, retryCount, maxRetries } = get();

    if (!failedMessage || retryCount >= maxRetries) {
      return;
    }

    set({ retryCount: retryCount + 1 });

    // Remove the error message
    set((state) => ({
      messages: state.messages.filter((msg) => !msg.isError),
      failedMessage: null,
    }));

    // Retry the message
    await get().sendMessage(
      failedMessage.content,
      failedMessage.file_attachments || []
    );
  },

  // Actions
  initializeConversation: () => {
    // Create a new thread without a specific ID - the server will assign one
    const newThread = {
      id: null, // Will be set by server on first message
      title: "New Chat", // Will be updated with actual query when first message is sent
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
          sources: msg.sources || [],
          tool_used: msg.tool_used || null,
          has_attachments: msg.has_attachments || false,
          file_attachments: msg.file_attachments || [],
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

  sendMessage: async (content, files = []) => {
    let { currentThread } = get();
    const { token } = useAuthStore.getState();

    if (!currentThread) {
      get().initializeConversation();
      // Get the updated currentThread after creating a new one
      currentThread = get().currentThread;
    }

    // Generate a UUID for the user message
    const userMessageId = generateUUID();

    const userMessage = {
      id: userMessageId,
      content,
      role: "user",
      timestamp: new Date(),
      has_attachments: files.length > 0,
      file_attachments: files.map((file, index) => ({
        id: `temp-${index}`,
        filename: file.name,
        file_type: file.type.split("/")[0] || "unknown",
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString(),
      })),
    };

    // Add user message immediately
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    // Create pending AI message for streaming
    const pendingMessageId = generateUUID();
    const pendingMessage = {
      id: pendingMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      sources: [],
      tool_used: null,
      has_attachments: false,
      file_attachments: [],
      isPending: true,
    };

    // Add pending message and start streaming
    set((state) => ({
      messages: [...state.messages, pendingMessage],
      isStreaming: true,
      pendingMessage,
      currentTool: null,
    }));

    // Debounced content update to prevent excessive re-renders
    const debouncedUpdateContent = debounce((delta) => {
      get().updateStreamingContent(delta);
    }, 50);

    try {
      // Prepare form data for multipart upload
      const formData = new FormData();
      formData.append("message", content);

      if (currentThread.id) {
        formData.append("conversation_id", currentThread.id);
      }

      // Add files to form data
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Make streaming API call to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let hasReceivedContent = false;
      let finalConversationId = null;
      let finalMessageId = null;
      let finalSources = [];
      let finalToolUsed = null;
      let finalFileAttachments = [];

      // Parse the SSE stream
      await parseSSEStream(
        response,
        // onEvent callback
        (event) => {
          if (!validateSSEEvent(event)) {
            console.warn("Invalid SSE event received:", event);
            return;
          }

          switch (event.type) {
            case "content":
              if (!hasReceivedContent) {
                // Hide loader on first content chunk
                set({ isLoading: false });
                hasReceivedContent = true;
              }
              debouncedUpdateContent(event.delta);
              break;

            case "tool_start":
              get().updateCurrentTool(event.tool);
              break;

            case "tool_end":
              get().updateCurrentTool(null);
              break;

            case "done":
              finalConversationId = event.conversation_id;
              finalMessageId = event.message_id;
              finalSources = event.sources || [];
              finalToolUsed = event.tool_used || null;
              finalFileAttachments = event.file_attachments || [];

              // Create final message
              const finalMessage = {
                id: finalMessageId || pendingMessageId,
                content: event.content || get().pendingMessage?.content || "",
                role: "assistant",
                timestamp: new Date(),
                sources: finalSources,
                tool_used: finalToolUsed,
                has_attachments: finalFileAttachments.length > 0,
                file_attachments: finalFileAttachments,
                isPending: false,
              };

              // Update conversation and thread info
              set((state) => {
                const updatedThread = state.currentThread
                  ? {
                      ...state.currentThread,
                      id: finalConversationId,
                      lastMessage: finalMessage,
                      title:
                        state.messages.length === 1 // Only first message
                          ? content.length > 50
                            ? content.substring(0, 50) + "..."
                            : content
                          : state.currentThread.title,
                    }
                  : null;

                return {
                  conversationId: finalConversationId,
                  currentThread: updatedThread,
                  threads: state.threads.map((thread) =>
                    thread.id === state.currentThread?.id
                      ? updatedThread
                      : thread
                  ),
                };
              });

              // Finish streaming
              get().finishStreaming(finalMessage);
              break;

            case "error":
              get().handleStreamError(
                event.content ||
                  "An error occurred while processing your message"
              );
              break;
          }
        },
        // onError callback
        (error) => {
          console.error("Stream parsing error:", error);
          const errorInfo = handleStreamError(error, (message, canRetry) => {
            get().handleStreamError(message, canRetry);
          });
        },
        // onComplete callback
        () => {
          console.log("Stream completed");
        }
      );

      // Refresh conversation list after sending message
      if (window.refreshConversationList) {
        window.refreshConversationList();
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Fallback to simulated response if API call fails
      setTimeout(() => {
        const fallbackAiMessageId = generateUUID();
        const aiMessage = {
          id: fallbackAiMessageId,
          content: "I'm a demo AI assistant. Your message was: " + content,
          role: "assistant",
          timestamp: new Date(),
          sources: [],
          tool_used: null,
          has_attachments: false,
          file_attachments: [],
          isPending: false,
        };

        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === pendingMessageId ? aiMessage : msg
          ),
          isLoading: false,
          isStreaming: false,
          pendingMessage: null,
          currentTool: null,
        }));
      }, 1000);
    }
  },

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
