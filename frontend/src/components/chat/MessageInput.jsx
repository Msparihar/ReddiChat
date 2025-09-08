import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useChatStore } from '../../stores/chat-store'
import { cn } from '../../lib/utils'

const MessageInput = () => {
  const [message, setMessage] = useState('')
  const { sendMessage, isLoading } = useChatStore()

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
        <div className="relative bg-gray-800/60 border border-gray-700/50 rounded-xl focus-within:border-gray-600 focus-within:bg-gray-800/80 transition-colors">
          {/* Left side buttons */}
          <div className="absolute left-3 bottom-3 flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 rounded-md transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="w-full bg-transparent pl-12 pr-12 py-3 text-sm resize-none focus:outline-none min-h-[48px] max-h-32 placeholder:text-gray-400 text-gray-100"
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

          {/* Right side - Send button */}
          <div className="absolute right-3 bottom-3">
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                message.trim() && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              )}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
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
