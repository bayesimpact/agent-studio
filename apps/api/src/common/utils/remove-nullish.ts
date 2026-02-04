type RemoveNullish<T> = {
  [K in keyof T as T[K] extends null | undefined ? never : K]: Exclude<T[K], null | undefined>
}

/**
 * Removes all null and undefined values from an object.
 * @param obj - The object to clean
 * @returns A new object with all null and undefined values removed
 */
export function removeNullish<T extends Record<string, unknown>>(obj: T): RemoveNullish<T> {
  const result = {} as RemoveNullish<T>

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof RemoveNullish<T>] = value as RemoveNullish<T>[keyof RemoveNullish<T>]
    }
  }

  return result
}
