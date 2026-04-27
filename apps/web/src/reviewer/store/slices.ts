import { combineReducers } from "@reduxjs/toolkit"
import type { AppDispatch } from "@/common/store"
import { dynamicMiddleware } from "@/common/store/dynamic-middleware"
import { rootSlices } from "@/common/store/root-slices"
import { reviewCampaignsReviewerMiddleware } from "../features/review-campaigns/reviewer.middleware"
import { reviewCampaignsReviewerSlice } from "../features/review-campaigns/reviewer.slice"
import type { ReviewerState } from "./types"

let middlewareInjected = false

const reviewerMiddlewareList = [reviewCampaignsReviewerMiddleware]

export const reviewerSliceList = [reviewCampaignsReviewerSlice]

const reviewerReducers = combineReducers(
  Object.assign({}, ...reviewerSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export function injectReviewerSlices() {
  const rr = rootSlices.withLazyLoadedSlices<ReviewerState>()
  // Reducers: inject() is idempotent — safe to call on every mount
  rr.inject({
    reducerPath: "reviewer",
    // @ts-expect-error - TypeScript cannot infer the type of the combined reducers, but it is correct
    reducer: reviewerReducers,
  })

  // Middleware: addMiddleware is NOT idempotent — guard against duplicate registration
  if (!middlewareInjected) {
    middlewareInjected = true
    reviewerMiddlewareList.forEach((m) => {
      dynamicMiddleware.addMiddleware(m.listenerMiddleware.middleware)
      m.registerListeners()
    })
  }
}

export function resetReviewerSlices(dispatch: AppDispatch) {
  middlewareInjected = false // reset the guard so middleware can be re-added
  reviewerSliceList.forEach((slice) => {
    dispatch(slice.actions.reset())
  })
  reviewerMiddlewareList.forEach((m) => {
    m.listenerMiddleware.clearListeners()
  })
}
