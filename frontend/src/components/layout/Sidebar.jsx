import { useEffect } from 'react'
import { Plus, LogOut, Menu, Settings } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { useChatStore } from '../../stores/chat-store'
import { useAuthStore } from '../../stores/auth-store'
import ConversationHistory from '../chat/ConversationHistory'
import { cn } from '../../lib/utils'

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, toggleSettings } = useUIStore()
  const { createNewThread } = useChatStore()
  const { user, logout } = useAuthStore()

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
        "bg-gray-900 border-r border-gray-750 transition-all duration-300 flex flex-col z-40",
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
        "border-b border-gray-750",
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
                  className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
                  title="Collapse sidebar"
                >
                  <Menu className="w-4 h-4 text-gray-400" />
                </button>
                <h1 className="text-lg font-semibold text-gray-100">ReddiChat</h1>
              </div>
              <button
                onClick={toggleSettings}
                className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
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
            {/* Top section - Hamburger and Settings */}
            <div className="flex flex-col space-y-1">
              <button
                onClick={toggleSidebar}
                className="w-full p-2 hover:bg-gray-800 rounded-md transition-colors flex items-center justify-center"
                aria-label="Expand sidebar"
              >
                <Menu className="w-5 h-5 text-gray-100" />
              </button>

              <button
                onClick={toggleSettings}
                className="w-full p-2 hover:bg-gray-800 rounded-md transition-colors flex items-center justify-center"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-gray-400" />
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
        "border-t border-gray-750",
        isSidebarOpen ? "p-3" : "p-2"
      )}>
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSettings}
            className={cn(
              "flex items-center w-full hover:bg-gray-800 rounded-md p-1 transition-colors",
              isSidebarOpen ? "gap-2.5" : "justify-center"
            )}
            aria-label="Open user settings"
          >
            <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium">{getUserInitials(user?.name)}</span>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
              <div className="text-sm font-normal truncate">{user?.name || 'Guest User'}</div>
              <div className="text-xs text-gray-500">Free</div>
              </div>
            )}
          </button>

          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full hover:bg-gray-800 rounded-md p-1 transition-colors text-sm text-gray-300"
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
