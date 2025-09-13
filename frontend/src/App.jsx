import { useEffect, useState } from 'react'
import AppRouter from './components/AppRouter'
import ThemeProvider from './contexts/ThemeContext'
import { FileProvider } from './contexts/FileContext'
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
      try {
        console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
        console.log('Initializing auth...')
        // Try to fetch user data (with stored token if available)
        const userData = await AuthService.getCurrentUser(token)
        console.log('User data fetched:', userData)
        login(userData, token)
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
  }, [token, login, logout])

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
      // Remove token from URL for security - BUT don't redirect to /chat yet
      window.history.replaceState({}, document.title, "/")

      // Fetch user data and login user
      AuthService.getCurrentUser(accessToken)
        .then(userData => {
          console.log('Successfully fetched user data:', userData)
          login(userData, accessToken)
          // NOW redirect to chat after successful authentication
          setTimeout(() => {
            window.location.href = '/chat'
          }, 100)
        })
        .catch(error => {
          console.error('Failed to fetch user data with URL token:', error)
          logout()
        })
    } else if (currentPath === '/auth/success') {
      console.log('Auth success path detected, trying cookie-based auth')
      // Remove the success path from URL - BUT don't redirect to /chat yet
      window.history.replaceState({}, document.title, "/")

      // Try to fetch user data with session cookie
      AuthService.getCurrentUser()
        .then(userData => {
          login(userData)
          // NOW redirect to chat after successful authentication
          setTimeout(() => {
            window.location.href = '/chat'
          }, 100)
        })
        .catch(error => {
          console.error('Failed to fetch user data with cookie:', error)
          logout()
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

  return (
    <ThemeProvider>
      <FileProvider>
        <AppRouter />
      </FileProvider>
    </ThemeProvider>
  )
}

export default App
