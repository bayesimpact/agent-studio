import type { testerSliceList } from "./slices"

export type TesterState =
  typeof testerSliceList extends Array<infer R>
    ? {
        // @ts-expect-error - Mapped type over array of slices to construct RootState shape
        [K in R as K["name"]]: ReturnType<K["reducer"]>
      }
    : never
