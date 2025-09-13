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
      // Main backgrounds
      primary: 'bg-gray-850',
      secondary: 'bg-gray-900',
      tertiary: 'bg-gray-800/60',

      // Text colors
      textPrimary: 'text-gray-100',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-400',

      // Borders
      borderPrimary: 'border-gray-750',
      borderSecondary: 'border-gray-700/50',
      borderHover: 'border-gray-600/60',

      // Interactive states
      hover: 'hover:bg-gray-800/80',
      hoverSecondary: 'hover:bg-gray-800',

      // Input styles
      inputBg: 'bg-gray-800/60',
      inputBorder: 'border-gray-700/50',
      inputFocus: 'focus-within:border-gray-600 focus-within:bg-gray-800/80',

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
      tertiary: 'bg-gray-50/40',

      // Text colors
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-800',
      textMuted: 'text-gray-600',

      // Borders - make them invisible/minimal
      borderPrimary: 'border-transparent',
      borderSecondary: 'border-transparent',
      borderHover: 'border-gray-200/60',

      // Interactive states
      hover: 'hover:bg-gray-100/60',
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
