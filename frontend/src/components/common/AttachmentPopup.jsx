import { X } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const AttachmentPopup = ({ isOpen, onClose }) => {
  const { colors } = useTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={cn("relative max-w-md mx-4 p-6 rounded-lg border", colors.secondary, colors.borderPrimary)}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={cn("absolute top-4 right-4 p-1 rounded-md transition-colors", colors.hoverSecondary)}
          aria-label="Close"
        >
          <X className={cn("w-4 h-4", colors.textMuted)} />
        </button>

        {/* Content */}
        <div className="pr-8">
          <h3 className={cn("text-lg font-semibold mb-3", colors.textPrimary)}>
            File Attachments Coming Soon
          </h3>
          <p className={cn("text-sm mb-4", colors.textSecondary)}>
            File attachment functionality is currently in development and will be available in a future update.
          </p>
          <p className={cn("text-sm mb-6", colors.textMuted)}>
            Soon you'll be able to attach images, documents, and other files to enhance your conversations.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttachmentPopup
