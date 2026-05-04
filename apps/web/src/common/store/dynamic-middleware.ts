import {
  type Action,
  createDynamicMiddleware,
  type ListenerMiddlewareInstance,
  type Reducer,
} from "@reduxjs/toolkit"
import { rootSlices } from "./root-slices"
import type { AppDispatch, RootState } from "./types"

export const dynamicMiddleware = createDynamicMiddleware()

type FeatureMiddleware = {
  listenerMiddleware: ListenerMiddlewareInstance<RootState, AppDispatch>
  registerListeners: () => void
}

type FeatureSlice = {
  name: string
  actions: {
    reset: () => Action
  }
}

export const createSliceManager = <State>({
  reducerPath,
  middlewares,
  reducer,
  slices,
}: {
  reducerPath: string
  reducer: Reducer<State>
  middlewares: FeatureMiddleware[]
  slices: FeatureSlice[]
}) => {
  let middlewareInjected = false

  function injectSlices() {
    const rr = rootSlices.withLazyLoadedSlices<State>()
    // Reducers: inject() is idempotent — safe to call on every mount
    // @ts-expect-error - reducerPath is a generic string, not a known key of State; combineReducers output is widened
    rr.inject({
      reducerPath,
      reducer,
    })

    // Middleware: addMiddleware is NOT idempotent — guard against duplicate registration
    if (!middlewareInjected) {
      middlewareInjected = true
      middlewares.forEach((m) => {
        dynamicMiddleware.addMiddleware(m.listenerMiddleware.middleware)
        m.registerListeners()
      })
    }
  }

  function resetSlices(dispatch: AppDispatch) {
    middlewareInjected = false // reset the guard so middleware can be re-added
    slices.forEach((slice) => {
      dispatch(slice.actions.reset())
    })
    middlewares.forEach((m) => {
      m.listenerMiddleware.clearListeners()
    })
  }

  return {
    injectSlices,
    resetSlices,
  }
}
