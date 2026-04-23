import { combineReducers } from "@reduxjs/toolkit"
import type { AppDispatch } from "@/common/store"
import { rootSlices } from "@/common/store/root-slices"
import { dynamicMiddleware } from "../../common/store/dynamic-middleware"
import { backofficeMiddleware } from "../features/backoffice/backoffice.middleware"
import { backofficeSlice } from "../features/backoffice/backoffice.slice"
import type { BackofficeState } from "./types"

let middlewareInjected = false

const backofficeMiddlewareList = [backofficeMiddleware]

export const backofficeSliceList = [backofficeSlice]

const backofficeReducers = combineReducers(
  Object.assign({}, ...backofficeSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export function injectBackofficeSlices() {
  const rr = rootSlices.withLazyLoadedSlices<BackofficeState>()
  // Reducers: inject() is idempotent — safe to call on every mount
  rr.inject({
    reducerPath: "backoffice",
    // @ts-expect-error - TypeScript cannot infer the type of the combined reducers, but it is correct
    reducer: backofficeReducers,
  })

  // Middleware: addMiddleware is NOT idempotent — guard against duplicate registration
  if (!middlewareInjected) {
    middlewareInjected = true
    backofficeMiddlewareList.forEach((m) => {
      dynamicMiddleware.addMiddleware(m.listenerMiddleware.middleware)
      m.registerListeners()
    })
  }
}

export function resetBackofficeSlices(dispatch: AppDispatch) {
  middlewareInjected = false // reset the guard so middleware can be re-added
  backofficeSliceList.forEach((slice) => {
    dispatch(slice.actions.reset())
  })
  backofficeMiddlewareList.forEach((m) => {
    m.listenerMiddleware.clearListeners()
  })
}
