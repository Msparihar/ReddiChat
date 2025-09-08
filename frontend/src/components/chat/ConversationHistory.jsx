import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '../../stores/auth-store'
import { useUIStore } from '../../stores/ui-store'
import AuthService from '../../services/auth-service'
import { useChatStore } from '../../stores/chat-store'
import { format } from 'date-fns'

const ConversationHistory = () => {
  const { token, login } = useAuthStore()
  const { isSidebarOpen } = useUIStore()
  const { loadConversation, currentThread, syncThreadsWithAPI, deleteThread, initializeConversation } = useChatStore()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingConversation, setLoadingConversation] = useState(null)
  const [deletingConversation, setDeletingConversation] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Fetch conversation history
  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) return

      try {
        setLoading(true)
        setError(null)
        const data = await AuthService.getConversationHistory(token, page, 10)
        setConversations(data.conversations)
        setTotalPages(data.pagination.pages)

        // Update user data if available (eliminates need for separate /auth/me call)
        if (data.user) {
          login(data.user, token)
        }

        // Sync with chat store threads
        syncThreadsWithAPI(data.conversations)
      } catch (err) {
        console.error('Error fetching conversations:', err)
        setError('Failed to load conversation history')
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [token, page])

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    try {
      setLoadingConversation(conversation.id)
      await loadConversation(conversation.id)

      // Auto-close sidebar on mobile after selecting conversation
      if (window.innerWidth < 768) {
        const { setSidebarOpen } = useUIStore.getState()
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
      setError(`Failed to load conversation: ${error.message}`)
    } finally {
      setLoadingConversation(null)
    }
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) {
      console.error('Cannot delete conversation: Invalid conversation ID')
      setError('Cannot delete conversation: Invalid ID')
      setShowDeleteConfirm(null)
      return
    }

    if (!token) {
      console.error('Cannot delete conversation: No authentication token')
      setError('Cannot delete conversation: Not authenticated')
      setShowDeleteConfirm(null)
      return
    }

    try {
      setDeletingConversation(conversationId)
      console.log(`Attempting to delete conversation: ${conversationId}`)

      // Call the API to delete the conversation
      const result = await AuthService.deleteConversation(token, conversationId)
      console.log('Delete API response:', result)

      // Update local state - remove from conversations list
      setConversations(prevConversations => {
        const filtered = prevConversations.filter(conv => conv.id !== conversationId)
        console.log(`Removed conversation from local state. Remaining: ${filtered.length}`)
        return filtered
      })

      // Remove from chat store threads
      deleteThread(conversationId)
      console.log('Removed conversation from chat store')

      // If the deleted conversation was currently active, initialize a new conversation
      if (currentThread?.id === conversationId) {
        console.log('Deleted conversation was active, initializing new conversation')
        initializeConversation()
      }

      // Clear error state and hide confirmation dialog
      setError(null)
      setShowDeleteConfirm(null)

      console.log(`✅ Conversation ${conversationId} deleted successfully`)
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error)

      // Provide more specific error messages
      let errorMessage = 'Failed to delete conversation'
      if (error.message.includes('404')) {
        errorMessage = 'Conversation not found or already deleted'
      } else if (error.message.includes('403')) {
        errorMessage = 'You do not have permission to delete this conversation'
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please log in again.'
      } else if (error.message) {
        errorMessage = `Failed to delete: ${error.message}`
      }

      setError(errorMessage)
      setShowDeleteConfirm(null)
    } finally {
      setDeletingConversation(null)
    }
  }

  // Handle delete confirmation
  const confirmDelete = (conversationId) => {
    setShowDeleteConfirm(conversationId)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  // Refresh conversation list
  const refreshConversations = async () => {
    if (!token) return

    try {
      const data = await AuthService.getConversationHistory(token, page, 10)
      setConversations(data.conversations)
      setTotalPages(data.pagination.pages)

      // Update user data if available
      if (data.user) {
        login(data.user, token)
      }

      // Sync with chat store threads
      syncThreadsWithAPI(data.conversations)
    } catch (err) {
      console.error('Error refreshing conversations:', err)
    }
  }

  // Expose refresh function to parent components
  useEffect(() => {
    // Store refresh function in a way that can be accessed globally
    window.refreshConversationList = refreshConversations

    return () => {
      delete window.refreshConversationList
    }
  }, [token, page])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isSidebarOpen || conversations.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev =>
            prev < conversations.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          event.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < conversations.length) {
            handleSelectConversation(conversations[focusedIndex])
          }
          break
        case 'Delete':
        case 'Backspace':
          if (event.ctrlKey && focusedIndex >= 0 && focusedIndex < conversations.length) {
            event.preventDefault()
            confirmDelete(conversations[focusedIndex].id)
          }
          break
        case 'Escape':
          event.preventDefault()
          setFocusedIndex(-1)
          if (showDeleteConfirm) {
            cancelDelete()
          }
          break
      }
    }

    // Only add listener when sidebar is open and has conversations
    if (isSidebarOpen && conversations.length > 0) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSidebarOpen, conversations, focusedIndex, showDeleteConfirm])

  // Reset focused index when conversations change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [conversations])

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Loading conversation history...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-400 text-sm mb-2">{error}</div>
        <button
          onClick={() => {
            setError(null)
            setPage(1) // Reset to first page and try again
          }}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Don't show conversation list when sidebar is collapsed
  if (!isSidebarOpen) {
    return null
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {conversations.length === 0 ? (
          <div className="text-gray-50 text-sm text-center py-8">
            No conversations yet
          </div>
        ) : (
          <>
            {/* Keyboard navigation hint */}
            {conversations.length > 0 && (
              <div className="px-2 pb-1 text-xs text-gray-500 text-center">
                Use ↑↓ to navigate, Enter to select, Ctrl+Del to delete
              </div>
            )}

            {conversations.map((conversation, index) => {
              const isActive = currentThread?.id === conversation.id
              const isLoading = loadingConversation === conversation.id
              const isDeleting = deletingConversation === conversation.id
              const showingDeleteConfirm = showDeleteConfirm === conversation.id
              const isFocused = focusedIndex === index

              return (
                <div key={conversation.id} className="relative group">
                  <button
                    onClick={() => handleSelectConversation(conversation)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(-1)}
                    disabled={isLoading || isDeleting}
                    className={`w-full p-2 rounded-md mb-1 transition-colors flex flex-col text-left relative ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : isFocused
                        ? 'bg-gray-750 ring-2 ring-blue-500'
                        : 'hover:bg-gray-800'
                    } ${isLoading || isDeleting ? 'opacity-50 cursor-wait' : ''}`}
                    aria-label={`Select chat: ${conversation.title}`}
                  >
                    <div
                      className="text-sm font-normal truncate pr-8"
                      title={conversation.title}
                    >
                      {conversation.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(conversation.updated_at), 'MMM d, yyyy')}
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDelete(conversation.id)
                    }}
                    disabled={isLoading || isDeleting}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete chat: ${conversation.title}`}
                  >
                    {isDeleting ? (
                      <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
                    )}
                  </button>

                  {/* Delete Confirmation Dialog */}
                  {showingDeleteConfirm && (
                    <div className="absolute inset-0 bg-gray-800 rounded-md p-2 flex flex-col justify-center z-10">
                      <div className="text-xs text-center mb-2">
                        Delete this conversation?
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDeleteConversation(conversation.id)}
                          className="flex-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded text-white"
                        >
                          Delete
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="flex-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 px-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded-md bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm rounded-md bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ConversationHistory
