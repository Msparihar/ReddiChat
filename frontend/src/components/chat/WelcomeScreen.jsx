import { Sparkles, BookOpen, Code, Lightbulb } from 'lucide-react'
import { useChatStore } from '../../stores/chat-store'
import { useAuthStore } from '../../stores/auth-store'
import { useUIStore } from '../../stores/ui-store'

const WelcomeScreen = () => {
  const { sendMessage } = useChatStore()
  const { user } = useAuthStore()
  const { toggleUpgradePopup } = useUIStore()

  const suggestedPrompts = [
    "How does AI work?",
    "Are black holes real?",
    "How many Rs are in the word \"strawberry\"?",
    "What is the meaning of life?"
  ]

  const categories = [
    { icon: Sparkles, label: "Create", color: "text-purple-400" },
    { icon: BookOpen, label: "Explore", color: "text-blue-400" },
    { icon: Code, label: "Code", color: "text-green-400" },
    { icon: Lightbulb, label: "Learn", color: "text-yellow-400" },
  ]

  const handlePromptClick = (prompt) => {
    sendMessage(prompt)
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6 max-w-3xl mx-auto overflow-y-auto bg-gray-850">
      <div className="text-center mb-8 mt-12">
        <h1 className="text-2xl font-normal mb-6">
          How can I help you{user?.name ? `, ${user.name.split(' ')[0]}` : ''}?
        </h1>
      </div>

      {/* Spacer to push content to center */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.label}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 hover:bg-gray-800/80 rounded-md transition-colors border border-gray-700/50"
              >
                <Icon className={`w-4 h-4 ${category.color}`} />
                <span className="text-sm font-normal">{category.label}</span>
              </button>
            )
          })}
        </div>

        {/* Suggested Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-xl">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="text-left p-3 bg-gray-800/60 hover:bg-gray-800/80 rounded-md transition-colors border border-gray-700/50 hover:border-gray-600/60"
            >
              <span className="text-sm text-gray-200">{prompt}</span>
            </button>
          ))}
        </div>

        {/* Upgrade Banner */}
        <div className="mt-8 text-center">
          <button
            onClick={toggleUpgradePopup}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-sm font-normal">Upgrade to Pro</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
