'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Globe } from 'lucide-react'

type Country = 'fr' | 'us'

interface CountryOption {
  code: Country
  label: string
  flag: string
}

const countries: CountryOption[] = [
  { code: 'fr', label: 'France', flag: '🇫🇷' },
  { code: 'us', label: 'United States', flag: '🇺🇸' },
]

interface CountrySwitcherProps {
  currentCountry: Country
}

export function CountrySwitcher({ currentCountry }: CountrySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

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
        <span className="font-medium">{selectedCountryData?.label}</span>
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
                <span>{country.label}</span>
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