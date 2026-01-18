"use client"

import { createContext, useContext, useEffect, useState } from "react"
import en from "@/messages/en.json"
import de from "@/messages/de.json"

type Locale = "en" | "de"
type Messages = typeof en

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const messages: Record<Locale, Messages> = {
  en,
  de,
}

const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split(".")
  let value = obj
  for (const key of keys) {
    value = value?.[key]
  }
  return typeof value === "string" ? value : path
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && (savedLocale === "en" || savedLocale === "de")) {
      setLocaleState(savedLocale)
      document.documentElement.lang = savedLocale
    } else {
      document.documentElement.lang = "de"
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("locale", newLocale)
    document.documentElement.lang = newLocale
  }

  const t = (key: string): string => {
    return getNestedValue(messages[locale], key)
  }

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale, setLocale, t }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
