import React, { createContext, useContext, useState, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage and apply it
  useEffect(() => {
    const saved = (localStorage.getItem('theme') || 'light') as Theme
    const userPrefs = localStorage.getItem('userPreferences')

    let initialTheme: Theme = saved
    if (userPrefs) {
      try {
        const prefs = JSON.parse(userPrefs)
        if (prefs.theme) {
          initialTheme = prefs.theme
        }
      } catch (error) {
        console.error('Failed to parse preferences:', error)
      }
    }

    setThemeState(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement
    let isDarkMode = false

    if (newTheme === 'system') {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      isDarkMode = newTheme === 'dark'
    }

    if (isDarkMode) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    setIsDark(isDarkMode)
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    // Also update userPreferences
    const userPrefs = localStorage.getItem('userPreferences')
    if (userPrefs) {
      try {
        const prefs = JSON.parse(userPrefs)
        localStorage.setItem('userPreferences', JSON.stringify({ ...prefs, theme: newTheme }))
      } catch (error) {
        console.error('Failed to update preferences:', error)
      }
    }

    applyTheme(newTheme)
  }

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e: MediaQueryListEvent) => {
        const html = document.documentElement
        if (e.matches) {
          html.classList.add('dark')
          setIsDark(true)
        } else {
          html.classList.remove('dark')
          setIsDark(false)
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    return undefined
  }, [theme])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
