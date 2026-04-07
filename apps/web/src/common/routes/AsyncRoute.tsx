import type { ReactNode } from "react"
import type { AsyncData } from "@/store/async-data-status"
import { ADS } from "@/store/async-data-status"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

type ExtractValues<T extends readonly AsyncData<unknown>[]> = {
  [K in keyof T]: T[K] extends AsyncData<infer V> ? V : never
}

export function AsyncRoute<T extends readonly AsyncData<unknown>[]>({
  data,
  children,
}: {
  data: [...T]
  children: (values: ExtractValues<T>) => ReactNode
}): ReactNode {
  const errorItem = data.find((item) => ADS.isError(item))
  if (errorItem) {
    return <ErrorRoute error={errorItem.error || "Unknown error"} />
  }

  if (data.every((item) => ADS.isFulfilled(item))) {
    const values = data.map((item) => item.value) as ExtractValues<T>
    // Fulfilled data is guaranteed to have value, so we can safely assert the type here
    return children(values)
  }

  return <LoadingRoute />
}
