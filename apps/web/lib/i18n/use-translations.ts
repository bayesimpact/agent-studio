import { useMemo } from 'react'
import { type Language, getTranslations, type Translations } from './translations'

export function countryToLanguage(country: 'fr' | 'us'): Language {
  return country === 'fr' ? 'fr' : 'en'
}

export function useTranslations(country: 'fr' | 'us'): Translations {
  return useMemo(() => {
    const language = countryToLanguage(country)
    return getTranslations(language)
  }, [country])
}