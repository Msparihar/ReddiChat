import { useEffect, useRef, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useChatStore } from '../../stores/chat-store'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'
import RedditSource from './RedditSource'
import MarkdownRenderer from './MarkdownRenderer'
import FileAttachment from './FileAttachment'
import FilePreviewModal from './FilePreviewModal'

const MessageList = () => {
  const { messages, isLoading } = useChatStore()
  const { colors, isDark } = useTheme()
  const messagesEndRef = useRef(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleFilePreview = (file) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setPreviewFile(null)
  }

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
              <div className={cn("px-4 py-6", isDark ? "bg-gray-900/30" : "bg-gray-50/40")}>
                <div className="max-w-3xl mx-auto flex gap-4 justify-end">
                  <div className="max-w-2xl">
                    {/* Display file attachments if they exist */}
                    {message.has_attachments && message.file_attachments && message.file_attachments.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.file_attachments.map((file, fileIndex) => (
                          <FileAttachment
                            key={fileIndex}
                            file={file}
                            showPreview={true}
                            onPreview={handleFilePreview}
                          />
                        ))}
                      </div>
                    )}
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    <div className={cn("text-xs mt-2 text-right", colors.textMuted)}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // AI message - ChatGPT style (no bubble)
              <div className={cn("px-4 py-6", isDark ? "bg-gray-900/20 border-b border-gray-800/50" : "bg-white")}>
                <div className="max-w-3xl mx-auto">
                  <div className="flex-1 min-w-0">
                    <MarkdownRenderer content={message.content} />

                    <div className={cn("flex items-center gap-4 mt-4 text-xs", colors.textMuted)}>
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.tool_used && (
                        <span className="text-blue-500">
                          • Used {message.tool_used === 'search_reddit' ? 'Reddit Search' : message.tool_used}
                        </span>
                      )}
                    </div>

                    {/* Display file attachments for AI messages if they exist */}
                    {message.has_attachments && message.file_attachments && message.file_attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className={cn("text-sm font-medium mb-2", colors.textSecondary)}>
                          Attached files:
                        </div>
                        {message.file_attachments.map((file, fileIndex) => (
                          <FileAttachment
                            key={fileIndex}
                            file={file}
                            showPreview={true}
                            onPreview={handleFilePreview}
                          />
                        ))}
                      </div>
                    )}

                    {/* Display Reddit sources if available */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className={cn("text-sm font-medium mb-3", colors.textSecondary)}>
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
          <div className={cn("px-4 py-6", isDark ? "bg-gray-900/20 border-b border-gray-800/50" : "bg-white")}>
            <div className="max-w-3xl mx-auto">
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full animate-bounce", colors.textMuted)} style={{ animationDelay: '0ms' }}></div>
                  <div className={cn("w-2 h-2 rounded-full animate-bounce", colors.textMuted)} style={{ animationDelay: '150ms' }}></div>
                  <div className={cn("w-2 h-2 rounded-full animate-bounce", colors.textMuted)} style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        file={previewFile}
        onClose={handleClosePreview}
      />
    </div>
  )
}

export default MessageList
