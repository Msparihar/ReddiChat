import Sidebar from './Sidebar'
import SettingsPage from '../settings/SettingsPage'
import UpgradePopup from '../common/UpgradePopup'
import AttachmentPopup from '../common/AttachmentPopup'
import { useUIStore } from '../../stores/ui-store'
import { useTheme } from '../../contexts/ThemeContext'
import { useFileContext } from '../../contexts/FileContext'
import { cn } from '../../lib/utils'

const AppLayout = ({ children }) => {
  const { isSidebarOpen, isSettingsOpen, isUpgradePopupOpen, isAttachmentPopupOpen, toggleUpgradePopup, toggleAttachmentPopup } = useUIStore()
 const { colors } = useTheme()
  const { addFiles } = useFileContext()

  const handleFilesSelected = (files) => {
    addFiles(files)
  }

  return (
    <div className={cn("h-screen", colors.primary, colors.textPrimary)}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div className={cn("fixed inset-0 z-30 md:hidden", colors.overlay)} />
      )}

      {/* Main content area */}
      <main
        className={cn(
          "fixed top-0 bottom-0 right-0 transition-all duration-300",
          colors.primary,
          isSidebarOpen
            ? "left-60"
            : "left-16"
        )}
      >
        <div className="h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsPage />}

      {/* Upgrade Popup */}
      <UpgradePopup isOpen={isUpgradePopupOpen} onClose={toggleUpgradePopup} />

      {/* Attachment Popup */}
      <AttachmentPopup
        isOpen={isAttachmentPopupOpen}
        onClose={toggleAttachmentPopup}
        onFilesSelected={handleFilesSelected}
      />
    </div>
  )
}

export default AppLayout
