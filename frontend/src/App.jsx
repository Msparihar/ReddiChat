import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ChatArea from './components/chat/ChatArea'
import Login from './components/auth/Login'
import { useUIStore } from './stores/ui-store'
import { useAuthStore } from './stores/auth-store'
import AuthService from './services/auth-service'

function App() {
  const { theme } = useUIStore()
  const { isAuthenticated, token, login, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  // Check if user is authenticated and fetch user data
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Fetch user data
          const userData = await AuthService.getCurrentUser(token)
          login(userData, token)
        } catch (error) {
          console.error('Failed to fetch user data:', error)
          // If there's an error fetching user data, logout
          logout()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [token, login, logout])

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')

    if (accessToken) {
      // Remove token from URL
      window.history.replaceState({}, document.title, "/")

      // Fetch user data and login user
      AuthService.getCurrentUser(accessToken)
        .then(userData => {
          login(userData, accessToken)
        })
        .catch(error => {
          console.error('Failed to fetch user data:', error)
          // If there's an error fetching user data, logout
          logout()
        })
    }
  }, [login, logout])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <AppLayout>
      <ChatArea />
    </AppLayout>
  )
}

export default App
