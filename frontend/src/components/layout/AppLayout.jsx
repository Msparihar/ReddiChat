import Sidebar from './Sidebar'
import SettingsPage from '../settings/SettingsPage'
import UpgradePopup from '../common/UpgradePopup'
import { useUIStore } from '../../stores/ui-store'
import { cn } from '../../lib/utils'

const AppLayout = ({ children }) => {
  const { isSidebarOpen, isSettingsOpen, isUpgradePopupOpen, toggleUpgradePopup } = useUIStore()

  return (
    <div className="h-screen bg-gray-850 text-gray-100">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" />
      )}

      {/* Main content area */}
      <main
        className={cn(
          "fixed top-0 bottom-0 right-0 transition-all duration-300 bg-gray-850",
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
    </div>
  )
}

export default AppLayout
