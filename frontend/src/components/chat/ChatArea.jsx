import { useChatStore } from '../../stores/chat-store'
import WelcomeScreen from './WelcomeScreen'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

const ChatArea = () => {
  const { currentThread, messages } = useChatStore()

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-850">
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
      <div className="flex-shrink-0 bg-gray-850 border-t border-gray-800/50">
        <MessageInput />
      </div>
    </div>
  )
}

export default ChatArea
