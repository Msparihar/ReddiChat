import { useEffect } from 'react'
import { Menu, Plus, LogOut } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { useChatStore } from '../../stores/chat-store'
import { useAuthStore } from '../../stores/auth-store'
import ConversationHistory from '../chat/ConversationHistory'
import { cn } from '../../lib/utils'

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
  const { createNewThread, toggleSettings } = useChatStore()
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
        "bg-gray-900 border-r border-gray-750 transition-all duration-300 flex flex-col z-30",
        // Desktop: normal sidebar behavior
        "md:relative",
        // Mobile: overlay sidebar
        "fixed inset-y-0 left-0 md:static",
        isSidebarOpen
          ? "w-60 translate-x-0"
          : "w-12 md:w-12 -translate-x-full md:translate-x-0"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Menu Button */}
      <button
        onClick={toggleSidebar}
        className="p-3 hover:bg-gray-800 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="px-2 pb-2 border-b border-gray-750">
        {isSidebarOpen && (
          <h1 className="text-base font-medium px-1 mb-2">Chat</h1>
        )}

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className={cn(
            "w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center transition-colors text-sm font-medium",
            isSidebarOpen ? "px-3 py-2 justify-center gap-2" : "p-2 justify-center"
          )}
          aria-label="Create new chat"
        >
          <Plus className="w-4 h-4" />
          {isSidebarOpen && "New Chat"}
        </button>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ConversationHistory />
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-750">
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSettings}
            className={cn(
              "flex items-center w-full hover:bg-gray-800 rounded-md p-1 transition-colors",
              isSidebarOpen && "gap-2.5"
            )}
            aria-label="Open settings"
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
