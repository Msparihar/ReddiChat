import Sidebar from './Sidebar'
import { useUIStore } from '../../stores/ui-store'
import { cn } from '../../lib/utils'

const AppLayout = ({ children }) => {
  const { isSidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" />
      )}

      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0">
        <main
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 bg-gray-950",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
