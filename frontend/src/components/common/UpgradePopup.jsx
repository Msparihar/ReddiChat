import { X, Sparkles, Check } from 'lucide-react'

const UpgradePopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-850 border border-gray-700 rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">Coming Soon!</h3>
            <p className="text-gray-400 text-sm">
              Pro features are currently in development and will be available in future updates.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-400" />
              <span>All current features are free to use</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-400" />
              <span>No limitations on conversations</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-400" />
              <span>Full access to Reddit integration</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-4 rounded-md transition-colors font-medium"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpgradePopup
