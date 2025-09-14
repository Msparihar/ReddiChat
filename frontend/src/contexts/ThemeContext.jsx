import { createContext, useContext, useEffect } from 'react'
import { useUIStore } from '../stores/ui-store'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { theme, toggleTheme } = useUIStore()

  // Theme configuration
  const themes = {
    dark: {
      // Main backgrounds - unified to eliminate separations
      primary: 'bg-gray-900',
      secondary: 'bg-gray-900',
      sidebar: 'bg-gray-950', // Slightly darker for sidebar
      tertiary: 'bg-gray-800/40',

      // Text colors
      textPrimary: 'text-gray-100',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-400',

      // Borders - make them invisible/subtle
      borderPrimary: 'border-transparent',
      borderSecondary: 'border-transparent',
      borderHover: 'border-gray-700/30',

      // Interactive states
      hover: 'hover:bg-gray-800/60',
      hoverSecondary: 'hover:bg-gray-800/40',

      // Input styles - unified with main background
      inputBg: 'bg-gray-900',
      inputBorder: 'border-gray-800/30',
      inputFocus: 'focus-within:border-gray-700/50 focus-within:bg-gray-900',

      // Special elements
      overlay: 'bg-black/50',
      scrollbar: 'rgba(155, 155, 155, 0.5)',

      // CSS body class
      bodyClass: 'dark'
    },
    light: {
      // Main backgrounds - unified to remove separations
      primary: 'bg-white',
      secondary: 'bg-white',
      sidebar: 'bg-gray-50', // Slightly darker for sidebar
      tertiary: 'bg-gray-100',

      // Text colors
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-800',
      textMuted: 'text-gray-600',

      // Borders - make them invisible/minimal
      borderPrimary: 'border-transparent',
      borderSecondary: 'border-gray-200',
      borderHover: 'border-gray-300',

      // Interactive states
      hover: 'hover:bg-gray-200',
      hoverSecondary: 'hover:bg-gray-100',

      // Input styles - unified with main background
      inputBg: 'bg-white',
      inputBorder: 'border-gray-200/40',
      inputFocus: 'focus-within:border-gray-300 focus-within:bg-white',

      // Special elements
      overlay: 'bg-black/30',
      scrollbar: 'rgba(0, 0, 0, 0.2)',

      // CSS body class
      bodyClass: 'light'
    }
  }

  const currentTheme = themes[theme]

  // Apply theme to body element
  useEffect(() => {
    const body = document.body
    body.className = body.className.replace(/\b(dark|light)\b/g, '')
    body.classList.add(currentTheme.bodyClass)

    // Update CSS custom properties for scrollbar
    document.documentElement.style.setProperty('--scrollbar-color', currentTheme.scrollbar)
  }, [theme, currentTheme])

  const value = {
    theme,
    toggleTheme,
    colors: currentTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
