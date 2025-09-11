import { FileText, Image, Video, AudioLines, Download, Eye } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const FileAttachment = ({ file, showPreview = false, onPreview, onDownload }) => {
  const { colors } = useTheme()

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'audio':
        return <AudioLines className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePreview = () => {
    if (onPreview && file.file_url) {
      onPreview(file)
    }
  }

  const handleDownload = () => {
    if (file.file_url) {
      if (onDownload) {
        onDownload(file)
      } else {
        // Default download behavior
        const link = document.createElement('a')
        link.href = file.file_url
        link.download = file.filename || 'download'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  const canPreview = file.file_type === 'image' && file.file_url
  const canDownload = file.file_url

  return (
    <div className={cn("flex items-center gap-2 p-3 rounded-lg border", colors.borderPrimary, colors.inputBg)}>
      <div className={cn("p-1.5 rounded-md", colors.secondary)}>
        {getFileIcon(file.file_type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium truncate", colors.textPrimary)}>
          {file.filename}
        </div>
        <div className={cn("text-xs", colors.textMuted)}>
          {file.file_type.toUpperCase()} • {formatFileSize(file.file_size)}
        </div>
      </div>

      {/* Action buttons for files with URLs */}
      {(canPreview || canDownload) && (
        <div className="flex items-center gap-1">
          {canPreview && showPreview && (
            <button
              onClick={handlePreview}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                colors.hoverSecondary,
                colors.textMuted
              )}
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {canDownload && (
            <button
              onClick={handleDownload}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                colors.hoverSecondary,
                colors.textMuted
              )}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FileAttachment
