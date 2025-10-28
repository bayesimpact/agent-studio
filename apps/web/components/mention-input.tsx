'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { AtSign } from 'lucide-react'

interface MentionOption {
  id: string
  label: string
  description: string
  icon?: React.ReactNode
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

// Available mention options
const MENTION_OPTIONS: MentionOption[] = [
  {
    id: 'trinity',
    label: '@trinity',
    description: 'Rechercher un profil bénéficiaire',
    icon: <AtSign className="w-4 h-4" />,
  },
]

export interface MentionInputRef {
  focus: () => void
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  ({ value, onChange, onKeyDown, disabled, placeholder, className }, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [mentionQuery, setMentionQuery] = useState('')
    const [mentionStartPos, setMentionStartPos] = useState<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
    }))

    // Filter mentions based on query
    const filteredMentions = mentionQuery
      ? MENTION_OPTIONS.filter((option) =>
          option.label.toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : MENTION_OPTIONS

    // Detect @ character and show suggestions
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      const cursorPos = e.target.selectionStart || 0

      // Find the last @ before cursor position
      const textBeforeCursor = newValue.slice(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')

      if (lastAtIndex !== -1) {
        // Check if there's a space between @ and cursor (if so, don't show suggestions)
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
        if (!textAfterAt.includes(' ')) {
          setMentionStartPos(lastAtIndex)
          setMentionQuery(textAfterAt)
          setShowSuggestions(true)
          setSelectedIndex(0)
        } else {
          setShowSuggestions(false)
        }
      } else {
        setShowSuggestions(false)
      }

      onChange(newValue)
    }

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showSuggestions && filteredMentions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % filteredMentions.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(
            (prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length
          )
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          insertMention(filteredMentions[selectedIndex])
          return
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setShowSuggestions(false)
          return
        }
      }

      // Pass through to parent handler
      if (onKeyDown) {
        onKeyDown(e)
      }
    }

    // Insert selected mention into input
    const insertMention = (mention: MentionOption) => {
      if (mentionStartPos === null) return

      const before = value.slice(0, mentionStartPos)
      const after = value.slice(mentionStartPos + mentionQuery.length + 1) // +1 for @
      const newValue = before + mention.label + ' ' + after

      onChange(newValue)
      setShowSuggestions(false)
      setMentionStartPos(null)
      setMentionQuery('')

      // Set cursor position after mention
      setTimeout(() => {
        const newCursorPos = mentionStartPos + mention.label.length + 1
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
        inputRef.current?.focus()
      }, 0)
    }

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [])

    return (
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`flex h-10 w-full rounded-md border-0 outline-none shadow-none bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-0 focus:shadow-none focus:ring-0 focus-visible:outline-none focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredMentions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <div className="py-1">
              {filteredMentions.map((mention, index) => (
                <button
                  key={mention.id}
                  type="button"
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => insertMention(mention)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                      index === selectedIndex
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {mention.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {mention.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {mention.description}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className="flex-shrink-0 text-xs text-blue-600 font-medium">
                      ⏎
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

MentionInput.displayName = 'MentionInput'
