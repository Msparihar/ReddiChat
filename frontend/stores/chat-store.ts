import { create } from "zustand";
import {
  generateUUID,
  parseSSEStream,
  handleStreamError,
  debounce,
  validateSSEEvent,
  SSEEvent,
} from "@/lib/streaming";

export interface FileAttachment {
  id: string;
  filename: string;
  originalFilename?: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  s3Url?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: any[];
  toolUsed?: string | null;
  hasAttachments?: boolean;
  fileAttachments?: FileAttachment[];
  isPending?: boolean;
  isError?: boolean;
  canRetry?: boolean;
}

export interface Thread {
  id: string | null;
  title: string;
  createdAt: Date;
  lastMessage?: Message | null;
  messages?: Message[];
}

interface ChatState {
  threads: Thread[];
  currentThread: Thread | null;
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  isStreaming: boolean;
  pendingMessage: Message | null;
  currentTool: string | null;
  failedMessage: Message | null;
  retryCount: number;
  maxRetries: number;

  // Actions
  startStreaming: (pendingMessage: Message) => void;
  updateStreamingContent: (delta: string) => void;
  updateCurrentTool: (tool: string | null) => void;
  finishStreaming: (finalMessage: Message) => void;
  handleStreamError: (errorMessage: string, canRetry?: boolean) => void;
  retryFailedMessage: () => Promise<void>;
  initializeConversation: () => Thread;
  createNewThread: () => Thread;
  selectThread: (threadId: string) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  syncThreadsWithAPI: (apiConversations: any[]) => void;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  deleteThread: (threadId: string) => void;
  setMessages: (messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  currentThread: null,
  messages: [],
  isLoading: false,
  conversationId: null,
  isStreaming: false,
  pendingMessage: null,
  currentTool: null,
  failedMessage: null,
  retryCount: 0,
  maxRetries: 3,

  startStreaming: (pendingMessage: Message) => {
    set({
      isStreaming: true,
      pendingMessage,
      currentTool: null,
    });
  },

  updateStreamingContent: (delta: string) => {
    set((state) => {
      if (!state.pendingMessage) return state;

      return {
        pendingMessage: {
          ...state.pendingMessage,
          content: state.pendingMessage.content + delta,
        },
        messages: state.messages.map((msg) =>
          msg.id === state.pendingMessage!.id
            ? { ...msg, content: msg.content + delta }
            : msg
        ),
      };
    });
  },

  updateCurrentTool: (tool: string | null) => {
    set({ currentTool: tool });
  },

  finishStreaming: (finalMessage: Message) => {
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

  handleStreamError: (errorMessage: string, canRetry: boolean = true) => {
    set((state) => {
      const errorMessageObj: Message = {
        id: state.pendingMessage?.id || generateUUID(),
        content: errorMessage,
        role: "assistant",
        timestamp: new Date(),
        sources: [],
        toolUsed: null,
        hasAttachments: false,
        fileAttachments: [],
        isError: true,
        canRetry: canRetry && state.retryCount < state.maxRetries,
      };

      const updatedMessages = state.pendingMessage
        ? state.messages.map((msg) =>
            msg.id === state.pendingMessage!.id ? errorMessageObj : msg
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

    set((state) => ({
      messages: state.messages.filter((msg) => !msg.isError),
      failedMessage: null,
    }));

    await get().sendMessage(failedMessage.content, []);
  },

  initializeConversation: () => {
    const newThread: Thread = {
      id: null,
      title: "New Chat",
      createdAt: new Date(),
      lastMessage: null,
    };

    set((state) => ({
      threads: [newThread, ...state.threads],
      currentThread: newThread,
      messages: [],
      conversationId: null,
    }));

    return newThread;
  },

  createNewThread: () => {
    return get().initializeConversation();
  },

  selectThread: (threadId: string) => {
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

  loadConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true });

      const response = await fetch(`/api/chat/history/${conversationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const conversationData = await response.json();

      const transformedMessages: Message[] = (conversationData.messages || [])
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.timestamp),
          sources: msg.sources || [],
          toolUsed: msg.tool_used || null,
          hasAttachments: msg.has_attachments || false,
          fileAttachments: msg.file_attachments || [],
        }))
        .sort(
          (a: Message, b: Message) =>
            a.timestamp.getTime() - b.timestamp.getTime()
        );

      const thread: Thread = {
        id: conversationData.id,
        title: conversationData.title,
        createdAt: new Date(conversationData.created_at),
        lastMessage:
          transformedMessages.length > 0
            ? transformedMessages[transformedMessages.length - 1]
            : null,
        messages: transformedMessages,
      };

      set((state) => {
        const existingThreadIndex = state.threads.findIndex(
          (t) => t.id === conversationId
        );
        const updatedThreads =
          existingThreadIndex >= 0
            ? state.threads.map((t) => (t.id === conversationId ? thread : t))
            : [thread, ...state.threads];

        return {
          currentThread: thread,
          messages: thread.messages || [],
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

  syncThreadsWithAPI: (apiConversations: any[]) => {
    set((state) => {
      const syncedThreads = apiConversations.map((conv) => {
        const existingThread = state.threads.find((t) => t.id === conv.id);

        return (
          existingThread || {
            id: conv.id,
            title: conv.title,
            createdAt: new Date(conv.created_at || conv.createdAt),
            lastMessage: null,
            messages: [],
          }
        );
      });

      return {
        ...state,
        threads: syncedThreads,
      };
    });
  },

  sendMessage: async (content: string, files: File[] = []) => {
    let { currentThread } = get();

    if (!currentThread) {
      get().initializeConversation();
      currentThread = get().currentThread;
    }

    const userMessageId = generateUUID();
    const userMessage: Message = {
      id: userMessageId,
      content,
      role: "user",
      timestamp: new Date(),
      hasAttachments: files.length > 0,
      fileAttachments: files.map((file, index) => ({
        id: `temp-${index}`,
        filename: file.name,
        fileType: file.type.split("/")[0] || "unknown",
        fileSize: file.size,
        mimeType: file.type,
      })),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    const pendingMessageId = generateUUID();
    const pendingMessage: Message = {
      id: pendingMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      sources: [],
      toolUsed: null,
      hasAttachments: false,
      fileAttachments: [],
      isPending: true,
    };

    set((state) => ({
      messages: [...state.messages, pendingMessage],
      isStreaming: true,
      pendingMessage,
      currentTool: null,
    }));

    const debouncedUpdateContent = debounce((delta: string) => {
      get().updateStreamingContent(delta);
    }, 50);

    try {
      const formData = new FormData();
      formData.append("message", content);

      if (currentThread?.id) {
        formData.append("conversation_id", currentThread.id);
      }

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let hasReceivedContent = false;
      let finalConversationId: string | null = null;
      let finalMessageId: string | null = null;
      let finalSources: any[] = [];
      let finalToolUsed: string | null = null;
      let finalFileAttachments: any[] = [];

      await parseSSEStream(
        response,
        (event: SSEEvent) => {
          if (!validateSSEEvent(event)) {
            console.warn("Invalid SSE event received:", event);
            return;
          }

          switch (event.type) {
            case "content":
              if (!hasReceivedContent) {
                set({ isLoading: false });
                hasReceivedContent = true;
              }
              if (event.delta) {
                debouncedUpdateContent(event.delta);
              }
              break;

            case "tool_start":
              get().updateCurrentTool(event.tool || null);
              break;

            case "tool_end":
              get().updateCurrentTool(null);
              break;

            case "done":
              finalConversationId = event.conversation_id || null;
              finalMessageId = event.message_id || null;
              finalSources = event.sources || [];
              finalToolUsed = event.tool_used || null;
              finalFileAttachments = event.file_attachments || [];

              const finalMessage: Message = {
                id: finalMessageId || pendingMessageId,
                content: event.content || get().pendingMessage?.content || "",
                role: "assistant",
                timestamp: new Date(),
                sources: finalSources,
                toolUsed: finalToolUsed,
                hasAttachments: finalFileAttachments.length > 0,
                fileAttachments: finalFileAttachments,
                isPending: false,
              };

              set((state) => {
                const updatedThread = state.currentThread
                  ? {
                      ...state.currentThread,
                      id: finalConversationId,
                      lastMessage: finalMessage,
                      title:
                        state.messages.length === 1
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
                    thread.id === state.currentThread?.id ||
                    (thread.id === null && state.currentThread?.id === null)
                      ? updatedThread!
                      : thread
                  ),
                };
              });

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
        (error: Error) => {
          console.error("Stream parsing error:", error);
          handleStreamError(error, (message, canRetry) => {
            get().handleStreamError(message, canRetry);
          });
        },
        () => {
          console.log("Stream completed");
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);

      setTimeout(() => {
        const fallbackAiMessage: Message = {
          id: generateUUID(),
          content:
            "Sorry, there was an error processing your message. Please try again.",
          role: "assistant",
          timestamp: new Date(),
          sources: [],
          toolUsed: null,
          hasAttachments: false,
          fileAttachments: [],
          isPending: false,
          isError: true,
          canRetry: true,
        };

        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === pendingMessageId ? fallbackAiMessage : msg
          ),
          isLoading: false,
          isStreaming: false,
          pendingMessage: null,
          currentTool: null,
        }));
      }, 500);
    }
  },

  deleteThread: (threadId: string) => {
    set((state) => ({
      threads: state.threads.filter((t) => t.id !== threadId),
      currentThread:
        state.currentThread?.id === threadId ? null : state.currentThread,
      messages: state.currentThread?.id === threadId ? [] : state.messages,
    }));
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },
}));
