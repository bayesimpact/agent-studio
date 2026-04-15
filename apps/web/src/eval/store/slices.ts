import { combineReducers } from "@reduxjs/toolkit"
import type { AppDispatch } from "@/common/store"
import { dynamicMiddleware } from "@/common/store/dynamic-middleware"
import { rootSlices } from "@/common/store/root-slices"
import { datasetsMiddleware } from "../features/datasets/datasets.middleware"
import { datasetsSlice } from "../features/datasets/datasets.slice"
import type { EvalState } from "./types"

let middlewareInjected = false

const evalMiddlewareList = [datasetsMiddleware]

export const evalSliceList = [datasetsSlice]

const evalReducers = combineReducers(
  Object.assign({}, ...evalSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export function injectEvalSlices() {
  const rr = rootSlices.withLazyLoadedSlices<EvalState>()
  // Reducers: inject() is idempotent — safe to call on every mount
  rr.inject({
    reducerPath: "evaluation",
    // @ts-expect-error - TypeScript cannot infer the type of the combined reducers, but it is correct
    reducer: evalReducers,
  })

  // Middleware: addMiddleware is NOT idempotent — guard against duplicate registration
  if (!middlewareInjected) {
    middlewareInjected = true
    evalMiddlewareList.forEach((m) => {
      dynamicMiddleware.addMiddleware(m.listenerMiddleware.middleware)
      m.registerListeners()
    })
  }
}

export function resetEvalSlices(dispatch: AppDispatch) {
  middlewareInjected = false // reset the guard so middleware can be re-added
  evalSliceList.forEach((slice) => {
    dispatch(slice.actions.reset())
  })
  evalMiddlewareList.forEach((m) => {
    m.listenerMiddleware.clearListeners()
  })
}
