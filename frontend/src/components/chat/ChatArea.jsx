import { useChatStore } from '../../stores/chat-store'
import { useTheme } from '../../contexts/ThemeContext'
import WelcomeScreen from './WelcomeScreen'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { cn } from '../../lib/utils'

const ChatArea = () => {
  const { currentThread, messages } = useChatStore()
  const { colors } = useTheme()

  return (
    <div className={cn("flex-1 flex flex-col h-full", colors.primary)}>
      {/* Chat Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!currentThread || messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="h-full overflow-y-auto">
            <MessageList />
          </div>
        )}
      </div>

      {/* Message Input Area - Fixed at bottom */}
      <div className={cn("flex-shrink-0", colors.primary)}>
        <MessageInput />
      </div>
    </div>
  )
}

export default ChatArea
