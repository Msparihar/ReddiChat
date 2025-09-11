import { X, Download, ExternalLink } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const FilePreviewModal = ({ isOpen, file, onClose }) => {
  const { colors } = useTheme()

  if (!isOpen || !file) return null

  const handleDownload = () => {
    if (file.file_url) {
      const link = document.createElement('a')
      link.href = file.file_url
      link.download = file.filename || 'download'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleOpenInNewTab = () => {
    if (file.file_url) {
      window.open(file.file_url, '_blank')
    }
  }

  const renderPreview = () => {
    switch (file.file_type) {
      case 'image':
        return (
          <div className="flex items-center justify-center max-h-[70vh] overflow-hidden">
            <img
              src={file.file_url}
              alt={file.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <div className={cn("hidden text-center p-8", colors.textMuted)}>
              <p>Unable to load image preview</p>
            </div>
          </div>
        )

      case 'audio':
        return (
          <div className="flex flex-col items-center p-8">
            <audio controls className="w-full max-w-md">
              <source src={file.file_url} type={file.mime_type} />
              Your browser does not support the audio element.
            </audio>
            <p className={cn("mt-4 text-sm", colors.textMuted)}>
              Audio file: {file.filename}
            </p>
          </div>
        )

      case 'video':
        return (
          <div className="flex items-center justify-center max-h-[70vh]">
            <video controls className="max-w-full max-h-full rounded-lg">
              <source src={file.file_url} type={file.mime_type} />
              Your browser does not support the video element.
            </video>
          </div>
        )

      case 'pdf':
        return (
          <div className="flex flex-col items-center p-8">
            <div className={cn("text-center mb-4", colors.textMuted)}>
              <p>PDF Preview</p>
              <p className="text-sm mt-2">Click "Open in New Tab" to view the full document</p>
            </div>
            <iframe
              src={file.file_url}
              className="w-full h-96 border rounded-lg"
              title={file.filename}
            />
          </div>
        )

      default:
        return (
          <div className={cn("flex flex-col items-center p-8 text-center", colors.textMuted)}>
            <p>Preview not available for this file type</p>
            <p className="text-sm mt-2">Use the download button to save the file</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "relative max-w-4xl max-h-[90vh] w-full rounded-lg overflow-hidden",
        colors.secondary,
        colors.borderPrimary,
        "border"
      )}>
        {/* Header */}
        <div className={cn("flex items-center justify-between p-4 border-b", colors.borderPrimary)}>
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-medium truncate", colors.textPrimary)}>
              {file.filename}
            </h3>
            <p className={cn("text-sm", colors.textMuted)}>
              {file.file_type.toUpperCase()} • {formatFileSize(file.file_size)}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {file.file_url && (
              <>
                <button
                  onClick={handleOpenInNewTab}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    colors.hoverSecondary,
                    colors.textMuted
                  )}
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    colors.hoverSecondary,
                    colors.textMuted
                  )}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-md transition-colors",
                colors.hoverSecondary,
                colors.textMuted
              )}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-80px)]">
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default FilePreviewModal
