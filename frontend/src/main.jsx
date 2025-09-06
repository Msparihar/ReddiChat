import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useChatStore } from './stores/chat-store'

// Initialize the conversation when the application starts
const initializeConversation = useChatStore.getState().initializeConversation
initializeConversation()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
