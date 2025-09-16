import { useEffect, useState } from 'react'
import AppRouter from './components/AppRouter'
import ThemeProvider from './contexts/ThemeContext'
import { FileProvider } from './contexts/FileContext'
import { useUIStore } from './stores/ui-store'
import { useAuthStore } from './stores/auth-store'
import AuthService from './services/auth-service'

function App() {
  const { theme } = useUIStore()
  const { isAuthenticated, login, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  // Check if user is authenticated and fetch user data via cookie
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
        console.log('Initializing auth...')
        // Try to fetch user data using cookie-based session
        const userData = await AuthService.getCurrentUser()
        console.log('User data fetched:', userData)
        login(userData, null)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        // If there's an error fetching user data, logout
        logout()
      } finally {
        console.log('Auth initialization complete, setting loading to false')
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [login, logout])

  // Handle OAuth callback: cookie is already set by backend and we land on /chat
  useEffect(() => {
    const currentPath = window.location.pathname

    console.log('=== OAuth Callback Check ===')
    console.log('Current URL:', window.location.href)
    console.log('Current path:', currentPath)
    console.log('Port:', window.location.port)

    if (currentPath === '/auth/success') {
      console.log('Auth success path detected, cookie should be present, redirecting to /chat')
      // Replace URL and navigate smoothly
      window.history.replaceState({}, document.title, "/")
      window.location.replace('/chat')
    }
  }, [login, logout])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-850 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <FileProvider>
        <AppRouter />
      </FileProvider>
    </ThemeProvider>
  )
}

export default App
