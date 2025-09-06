import { useChatStore } from '../../stores/chat-store'
import WelcomeScreen from './WelcomeScreen'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

const ChatArea = () => {
  const { currentThread, messages } = useChatStore()

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!currentThread || messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <MessageList />
        )}
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  )
}

export default ChatArea
