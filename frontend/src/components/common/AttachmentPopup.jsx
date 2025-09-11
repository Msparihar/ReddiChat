import { X, Paperclip, Upload, FileText, Image, Video, AudioLines } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const AttachmentPopup = ({ isOpen, onClose, onFilesSelected }) => {
  const { colors } = useTheme()

  if (!isOpen) return null

  const handleFileSelect = (event) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Pass selected files to parent component
      onFilesSelected(Array.from(files))
      // Close the popup
      onClose()
    }
  }

  const triggerFileInput = () => {
    document.getElementById('file-input')?.click()
  }

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
            Attach Files
          </h3>
          <p className={cn("text-sm mb-4", colors.textSecondary)}>
            Upload images, documents, and other files to enhance your conversation.
          </p>

          {/* File type options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={triggerFileInput}
              className={cn("flex flex-col items-center justify-center p-4 rounded-lg border transition-colors", colors.borderPrimary, colors.hoverSecondary)}
            >
              <Paperclip className={cn("w-6 h-6 mb-2", colors.textPrimary)} />
              <span className={cn("text-sm font-medium", colors.textPrimary)}>From Device</span>
            </button>

            <button
              disabled
              className={cn("flex flex-col items-center justify-center p-4 rounded-lg border transition-colors opacity-50 cursor-not-allowed", colors.borderPrimary)}
            >
              <Upload className={cn("w-6 h-6 mb-2", colors.textMuted)} />
              <span className={cn("text-sm font-medium", colors.textMuted)}>From Cloud</span>
            </button>
          </div>

          {/* Supported file types */}
          <div className="mb-6">
            <h4 className={cn("text-sm font-medium mb-2", colors.textPrimary)}>Supported File Types</h4>
            <div className="flex flex-wrap gap-2">
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs", colors.secondary, colors.textMuted)}>
                <Image className="w-3 h-3" />
                <span>Images</span>
              </div>
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs", colors.secondary, colors.textMuted)}>
                <AudioLines className="w-3 h-3" />
                <span>Audio</span>
              </div>
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs", colors.secondary, colors.textMuted)}>
                <Video className="w-3 h-3" />
                <span>Video</span>
              </div>
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs", colors.secondary, colors.textMuted)}>
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,audio/*,video/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttachmentPopup
