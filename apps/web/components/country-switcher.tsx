'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Globe } from 'lucide-react'
import { useTranslations } from '../lib/i18n/use-translations'

type Country = 'fr' | 'us'

interface CountryOption {
  code: Country
  flag: string
}

interface CountrySwitcherProps {
  currentCountry: Country
}

export function CountrySwitcher({ currentCountry }: CountrySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations(currentCountry)

  const countries: CountryOption[] = [
    { code: 'fr', flag: '🇫🇷' },
    { code: 'us', flag: '🇺🇸' },
  ]

  const getCountryLabel = (code: Country): string => {
    return code === 'fr' ? t.country.france : t.country.unitedStates
  }

  const selectedCountryData = countries.find((c) => c.code === currentCountry)

  const handleCountryChange = (countryCode: Country) => {
    setIsOpen(false)
    router.push(`/${countryCode}`)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 h-auto"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{selectedCountryData?.flag}</span>
        <span className="font-medium">{getCountryLabel(currentCountry)}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20 min-w-[200px]">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountryChange(country.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
                  country.code === currentCountry
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground'
                }`}
              >
                <span className="text-xl">{country.flag}</span>
                <span>{getCountryLabel(country.code)}</span>
                {country.code === currentCountry && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}