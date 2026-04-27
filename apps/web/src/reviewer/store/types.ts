import type { reviewerSliceList } from "./slices"

export type ReviewerState =
  typeof reviewerSliceList extends Array<infer R>
    ? {
        // @ts-expect-error - Mapped type over array of slices to construct RootState shape
        [K in R as K["name"]]: ReturnType<K["reducer"]>
      }
    : never
