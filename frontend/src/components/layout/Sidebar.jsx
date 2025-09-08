import { useEffect } from 'react'
import { Plus, LogOut, Menu, Settings, Sun, Moon } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { useChatStore } from '../../stores/chat-store'
import { useAuthStore } from '../../stores/auth-store'
import { useTheme } from '../../contexts/ThemeContext'
import ConversationHistory from '../chat/ConversationHistory'
import { cn } from '../../lib/utils'

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, toggleSettings } = useUIStore()
  const { createNewThread } = useChatStore()
  const { user, logout } = useAuthStore()
  const { colors, toggleTheme, isDark } = useTheme()

  // Function to get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

 const handleNewChat = () => {
    createNewThread()
    // Auto-close sidebar on mobile after creating new chat
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  // Handle outside click on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        const sidebar = document.querySelector('[data-sidebar]')
        if (sidebar && !sidebar.contains(event.target)) {
          setSidebarOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen, setSidebarOpen])

  return (
    <aside
      data-sidebar
      className={cn(
        colors.secondary, colors.borderPrimary, "border-r transition-all duration-300 flex flex-col z-40",
        // Desktop: normal sidebar behavior - full height
        "md:fixed md:top-0 md:bottom-0 md:left-0",
        // Mobile: overlay sidebar
        "fixed top-0 bottom-0 left-0",
        isSidebarOpen
          ? "w-60 translate-x-0"
          : "w-16 translate-x-0"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Sidebar Header */}
      <div className={cn(
        "border-b", colors.borderPrimary,
        isSidebarOpen ? "p-3" : "p-2"
      )}>
        {isSidebarOpen ? (
          /* Expanded sidebar layout */
          <div className="space-y-3">
            {/* Header with ReddiChat branding and Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSidebar}
                  className={cn("p-1.5 rounded-md transition-colors", colors.hoverSecondary)}
                  title="Collapse sidebar"
                >
                  <Menu className={cn("w-4 h-4", colors.textMuted)} />
                </button>
                <h1 className={cn("text-lg font-semibold", colors.textPrimary)}>ReddiChat</h1>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className={cn("p-1.5 rounded-md transition-colors", colors.hoverSecondary)}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? <Sun className={cn("w-4 h-4", colors.textMuted)} /> : <Moon className={cn("w-4 h-4", colors.textMuted)} />}
                </button>
                <button
                  onClick={toggleSettings}
                  className={cn("p-1.5 rounded-md transition-colors", colors.hoverSecondary)}
                  title="Settings"
                >
                  <Settings className={cn("w-4 h-4", colors.textMuted)} />
                </button>
              </div>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center gap-2 px-3 py-2 transition-colors text-sm font-medium"
              aria-label="Create new chat"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        ) : (
          /* Collapsed sidebar layout */
          <div className="space-y-2">
            {/* Top section - Hamburger, Theme, and Settings */}
            <div className="flex flex-col space-y-1">
              <button
                onClick={toggleSidebar}
                className={cn("w-full p-2 rounded-md transition-colors flex items-center justify-center", colors.hoverSecondary)}
                aria-label="Expand sidebar"
              >
                <Menu className={cn("w-5 h-5", colors.textPrimary)} />
              </button>

              <button
                onClick={toggleTheme}
                className={cn("w-full p-2 rounded-md transition-colors flex items-center justify-center", colors.hoverSecondary)}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun className={cn("w-4 h-4", colors.textMuted)} /> : <Moon className={cn("w-4 h-4", colors.textMuted)} />}
              </button>

              <button
                onClick={toggleSettings}
                className={cn("w-full p-2 rounded-md transition-colors flex items-center justify-center", colors.hoverSecondary)}
                aria-label="Settings"
              >
                <Settings className={cn("w-4 h-4", colors.textMuted)} />
              </button>
            </div>

            {/* New Chat Icon */}
            <button
              onClick={handleNewChat}
              className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center justify-center"
              aria-label="Create new chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ConversationHistory />
      </div>

      {/* User Profile */}
      <div className={cn(
        "border-t", colors.borderPrimary,
        isSidebarOpen ? "p-3" : "p-2"
      )}>
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSettings}
            className={cn(
              "flex items-center w-full rounded-md p-1 transition-colors",
              colors.hoverSecondary,
              isSidebarOpen ? "gap-2.5" : "justify-center"
            )}
            aria-label="Open user settings"
          >
            <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-white">{getUserInitials(user?.name)}</span>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-normal truncate", colors.textPrimary)}>{user?.name || 'Guest User'}</div>
                <div className={cn("text-xs", colors.textMuted)}>Free</div>
              </div>
            )}
          </button>

          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className={cn("flex items-center gap-2 w-full rounded-md p-1 transition-colors text-sm", colors.hoverSecondary, colors.textSecondary)}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
