import { useEffect, useState } from "react"
import { toast } from "sonner"

type CopyFn = (text: string) => Promise<boolean> // Returns true on success, false on failure
export function useCopyToClipboard(messageOnSuccess: string): {
  copy: CopyFn
  isCopied: boolean
} {
  const [isCopied, setIsCopied] = useState(false)

  const copy: CopyFn = async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported")
      return false
    }

    // Try to save to clipboard
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      return true
    } catch (error) {
      console.warn("Copy failed", error)
      setIsCopied(false)
      return false
    }
  }

  // Reset the "isCopied" state after a delay
  useEffect(() => {
    if (!isCopied) return
    const timeout = setTimeout(() => {
      setIsCopied(false)
    }, 2000) // Reset after 2 seconds

    toast(messageOnSuccess, {
      closeButton: true,
      dismissible: true,
    })

    return () => {
      clearTimeout(timeout)
    }
  }, [isCopied, messageOnSuccess])

  return { copy, isCopied }
}
