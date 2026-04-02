import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function normalizeImportantSuffixToken(token: string): string {
  if (!token.endsWith("!") || token.startsWith("!")) {
    return token
  }

  const tokenWithoutImportantSuffix = token.slice(0, -1)
  const tokenParts = tokenWithoutImportantSuffix.split(":")
  const utilityToken = tokenParts.pop()
  if (!utilityToken || utilityToken.startsWith("!")) {
    return token
  }

  return [...tokenParts, `!${utilityToken}`].join(":")
}

function normalizeImportantSuffixClasses(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => normalizeImportantSuffixToken(token))
    .join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(normalizeImportantSuffixClasses(clsx(inputs)))
}

// Can be used to hash a string to a unique identifier (in order to avoid using the index as a key in a React list)
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}
