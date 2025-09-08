import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ChatArea from './components/chat/ChatArea'
import Login from './components/auth/Login'
import ThemeProvider from './contexts/ThemeContext'
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

  // Initialize app without making redundant auth calls
  // User data will be fetched when ConversationHistory loads
  useEffect(() => {
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    console.log('App initialization - skipping redundant auth call')
    // Set loading to false immediately if we already have auth state
    if (isAuthenticated || !token) {
      setIsLoading(false)
    }
  }, [isAuthenticated, token])

  // Handle OAuth callback (both URL token and /auth/success)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const currentPath = window.location.pathname

    console.log('=== OAuth Callback Check ===')
    console.log('Current URL:', window.location.href)
    console.log('Current path:', currentPath)
    console.log('URL search params:', window.location.search)
    console.log('Access token found:', !!accessToken)
    console.log('Port:', window.location.port)

    if (accessToken) {
      console.log('Found access token in URL:', accessToken.substring(0, 20) + '...')
      // Remove token from URL for security
      window.history.replaceState({}, document.title, "/")

      // Fetch user data and login user (OAuth callback only)
      AuthService.getCurrentUser(accessToken)
        .then(userData => {
          console.log('Successfully fetched user data:', userData)
          login(userData, accessToken)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Failed to fetch user data with URL token:', error)
          logout()
          setIsLoading(false)
        })
    } else if (currentPath === '/auth/success') {
      console.log('Auth success path detected, trying cookie-based auth')
      // Remove the success path from URL
      window.history.replaceState({}, document.title, "/")

      // Try to fetch user data with session cookie (OAuth callback only)
      AuthService.getCurrentUser()
        .then(userData => {
          login(userData)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Failed to fetch user data with cookie:', error)
          logout()
          setIsLoading(false)
        })
    } else {
      console.log('No OAuth callback detected - normal page load')
    }
  }, [login, logout])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-850 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Login />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <AppLayout>
        <ChatArea />
      </AppLayout>
    </ThemeProvider>
  )
}

export default App
