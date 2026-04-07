import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit"
import type { Services } from "@/di/services"
import type { studioSliceList } from "./slices"

// Define the store state structure without creating the store
// This allows us to use these types in listenerMiddleware without circular dependencies
export type StudioState =
  typeof studioSliceList extends Array<infer R>
    ? {
        // @ts-expect-error - Mapped type over array of slices to construct RootState shape
        [K in R as K["name"]]: ReturnType<K["reducer"]>
      }
    : never

// Extra argument passed to thunks for dependency injection
export type ThunkExtraArg = {
  services: Services
}

export type StudioAppDispatch = ThunkDispatch<StudioState, ThunkExtraArg, UnknownAction>
