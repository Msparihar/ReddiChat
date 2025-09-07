import { useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { cn } from '../../lib/utils'
import RedditSource from './RedditSource'

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
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">AI</span>
              </div>
            )}

            <div className="max-w-2xl">
              <div
                className={cn(
                  "px-3 py-2.5 rounded-lg",
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-850 text-gray-100 border border-gray-700'
                )}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>

                <div className="text-xs opacity-60 mt-1.5">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {message.tool_used && (
                    <span className="ml-2 text-blue-400">
                      • Used {message.tool_used === 'search_reddit' ? 'Reddit Search' : message.tool_used}
                    </span>
                  )}
                </div>
              </div>

              {/* Display Reddit sources if available */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-gray-400 mb-2">
                    Sources from Reddit:
                  </div>
                  {message.sources.map((source, index) => (
                    <RedditSource key={index} source={source} index={index} />
                  ))}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">M</span>
              </div>
            )}
          </div>
        ))}

                {/* Loading Message */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium">AI</span>
            </div>

            <div className="max-w-2xl px-3 py-2.5 rounded-lg bg-gray-850 text-gray-100 border border-gray-700">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
