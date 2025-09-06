import { useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { cn } from '../../lib/utils'

const MessageList = () => {
  const { messages, isLoading } = useChatStore()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

    return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
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

            <div
              className={cn(
                "max-w-2xl px-3 py-2.5 rounded-lg",
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
              </div>
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
