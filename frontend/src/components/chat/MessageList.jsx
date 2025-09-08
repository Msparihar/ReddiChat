import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { useChatStore } from '../../stores/chat-store'
import { cn } from '../../lib/utils'
import RedditSource from './RedditSource'
import MarkdownRenderer from './MarkdownRenderer'

const MessageList = () => {
  const { messages, isLoading } = useChatStore()
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Scroll to bottom when component mounts (for initial load)
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
        }
      }, 100) // Small delay to ensure DOM is fully rendered
    }
  }, [])

  return (
    <div className="h-full scrollbar-thin">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              // User message - keep bubble style
              <div className="px-4 py-6 bg-gray-900/50">
                <div className="max-w-3xl mx-auto flex gap-4 justify-end">
                  <div className="max-w-2xl">
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">M</span>
                  </div>
                </div>
              </div>
            ) : (
              // AI message - ChatGPT style (no bubble)
              <div className="px-4 py-6 bg-gray-850/30 border-b border-gray-800/50">
                <div className="max-w-3xl mx-auto flex gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-medium text-white">AI</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <MarkdownRenderer content={message.content} />

                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.tool_used && (
                        <span className="text-blue-400">
                          • Used {message.tool_used === 'search_reddit' ? 'Reddit Search' : message.tool_used}
                        </span>
                      )}
                    </div>

                    {/* Display Reddit sources if available */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className="text-sm font-medium text-gray-300 mb-3">
                          Sources from Reddit:
                        </div>
                        {message.sources.map((source, index) => (
                          <RedditSource key={index} source={source} index={index} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Message */}
        {isLoading && (
          <div className="px-4 py-6 bg-gray-850/30 border-b border-gray-800/50">
            <div className="max-w-3xl mx-auto flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-xs font-medium text-white">AI</span>
              </div>
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
