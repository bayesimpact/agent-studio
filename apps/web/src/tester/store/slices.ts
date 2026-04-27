import { combineReducers } from "@reduxjs/toolkit"
import type { AppDispatch } from "@/common/store"
import { dynamicMiddleware } from "@/common/store/dynamic-middleware"
import { rootSlices } from "@/common/store/root-slices"
import { reviewCampaignsTesterMiddleware } from "../features/review-campaigns/tester.middleware"
import { reviewCampaignsTesterSlice } from "../features/review-campaigns/tester.slice"
import type { TesterState } from "./types"

let middlewareInjected = false

const testerMiddlewareList = [reviewCampaignsTesterMiddleware]

export const testerSliceList = [reviewCampaignsTesterSlice]

const testerReducers = combineReducers(
  Object.assign({}, ...testerSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export function injectTesterSlices() {
  const rr = rootSlices.withLazyLoadedSlices<TesterState>()
  // Reducers: inject() is idempotent — safe to call on every mount
  rr.inject({
    reducerPath: "tester",
    // @ts-expect-error - TypeScript cannot infer the type of the combined reducers, but it is correct
    reducer: testerReducers,
  })

  // Middleware: addMiddleware is NOT idempotent — guard against duplicate registration
  if (!middlewareInjected) {
    middlewareInjected = true
    testerMiddlewareList.forEach((m) => {
      dynamicMiddleware.addMiddleware(m.listenerMiddleware.middleware)
      m.registerListeners()
    })
  }
}

export function resetTesterSlices(dispatch: AppDispatch) {
  middlewareInjected = false // reset the guard so middleware can be re-added
  testerSliceList.forEach((slice) => {
    dispatch(slice.actions.reset())
  })
  testerMiddlewareList.forEach((m) => {
    m.listenerMiddleware.clearListeners()
  })
}
