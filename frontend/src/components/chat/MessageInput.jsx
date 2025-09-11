import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useChatStore } from '../../stores/chat-store'
import { useUIStore } from '../../stores/ui-store'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const MessageInput = () => {
  const [message, setMessage] = useState('')
  const { sendMessage, isLoading } = useChatStore()
  const { toggleAttachmentPopup } = useUIStore()
  const { colors } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    await sendMessage(message)
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="relative">
        {/* Input Container with integrated buttons */}
        <div className={cn("relative border rounded-xl transition-colors flex items-end", colors.inputBg, colors.inputBorder, colors.inputFocus)}>
          {/* Left side buttons */}
          <div className="flex items-center p-3 pb-3">
            <button
              type="button"
              onClick={toggleAttachmentPopup}
              className={cn("p-1.5 rounded-md transition-colors", colors.textMuted, colors.hoverSecondary)}
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea Container */}
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className={cn("w-full bg-transparent py-3 pr-16 text-sm resize-none focus:outline-none min-h-[48px] max-h-32 placeholder:text-gray-400 scrollbar-thin pt-4", colors.textPrimary)}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '48px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />

            {/* Right side - Send button positioned absolutely */}
            <div className="absolute right-3 bottom-3">
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  message.trim() && !isLoading
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                )}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </div>
      </form>
    </div>
  )
}

export default MessageInput
