import type { backofficeSliceList } from "./slices"

export type BackofficeState =
  typeof backofficeSliceList extends Array<infer R>
    ? {
        // @ts-expect-error - Mapped type over array of slices to construct RootState shape
        [K in R as K["name"]]: ReturnType<K["reducer"]>
      }
    : never
