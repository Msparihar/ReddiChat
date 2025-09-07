import { useState } from 'react'
import { Send, Search, Paperclip, Settings, Sun, Moon, Mic, Volume2 } from 'lucide-react'
import { useChatStore } from '../../stores/chat-store'
import { useUIStore } from '../../stores/ui-store'
import { cn } from '../../lib/utils'

const MessageInput = () => {
  const [message, setMessage] = useState('')
  const { sendMessage, isLoading } = useChatStore()
  const { toggleSettings, theme, toggleTheme } = useUIStore()

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
      {/* Message Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="w-full bg-gray-850 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:border-gray-600 focus:bg-gray-800 min-h-[48px] max-h-32"
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

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors",
                message.trim() && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-3">
        {/* Helper Text - Left aligned */}
        <div className="text-xs text-gray-500">
          Press Enter to send, Shift + Enter for new line
        </div>

        {/* Action Buttons - Right aligned */}
        <div className="flex items-center gap-1">
          {/* Main Action Buttons */}
          <button
            className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Controls */}
          <div className="flex items-center gap-1 mx-1">
            <button
              className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
              title="Audio output"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Controls */}
          <div className="flex items-center gap-1 ml-1 border-l border-gray-700 pl-2">
            <button
              onClick={toggleSettings}
              className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageInput
