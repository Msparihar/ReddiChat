import { X, User, Mail, Calendar, Crown } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { useAuthStore } from '../../stores/auth-store'

const SettingsPage = () => {
  const { toggleSettings } = useUIStore()
  const { user } = useAuthStore()

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-850 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-1 hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Information */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            User Information
          </h3>

          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <div className="font-medium">{user?.name || 'Guest User'}</div>
                <div className="text-sm text-gray-400">Free Account</div>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="text-sm">{user?.email || 'Not provided'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Member Since</div>
                  <div className="text-sm">{formatDate(user?.created_at)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Plan</div>
                  <div className="text-sm">Free</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            ReddiChat v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
