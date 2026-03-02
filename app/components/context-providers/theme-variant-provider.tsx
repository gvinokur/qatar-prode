'use client'

import {createContext, useContext, useEffect, useState, ReactNode} from 'react'

export type ThemeVariant = 'violet' | 'rose' | 'olive'

interface ThemeVariantContextType {
  variant: ThemeVariant
  setVariant: (variant: ThemeVariant) => void
}

const ThemeVariantContext = createContext<ThemeVariantContextType | undefined>(undefined)

export function ThemeVariantProvider({ children }: { children: ReactNode }) {
  // Get default theme from environment variable or fallback to violet
  const defaultTheme = (process.env.NEXT_PUBLIC_DEFAULT_THEME_VARIANT as ThemeVariant) || 'violet'
  const [variant, setVariantState] = useState<ThemeVariant>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Load variant from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme-variant') as ThemeVariant
    if (stored && ['violet', 'rose', 'olive'].includes(stored)) {
      setVariantState(stored)
    } else {
      // If no stored preference, use environment variable default
      setVariantState(defaultTheme)
    }
  }, [defaultTheme])

  // Save to localStorage when variant changes
  const setVariant = (newVariant: ThemeVariant) => {
    setVariantState(newVariant)
    if (mounted) {
      localStorage.setItem('theme-variant', newVariant)
    }
  }

  return (
    <ThemeVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </ThemeVariantContext.Provider>
  )
}

export function useThemeVariant() {
  const context = useContext(ThemeVariantContext)
  if (context === undefined) {
    throw new Error('useThemeVariant must be used within ThemeVariantProvider')
  }
  return context
}
