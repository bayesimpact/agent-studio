import { combineReducers } from "@reduxjs/toolkit"
import { createSliceManager } from "@/common/store/dynamic-middleware"
import { reviewCampaignsReviewerMiddleware } from "../features/review-campaigns/reviewer.middleware"
import { reviewCampaignsReviewerSlice } from "../features/review-campaigns/reviewer.slice"

const reviewerMiddlewareList = [reviewCampaignsReviewerMiddleware]

export const reviewerSliceList = [reviewCampaignsReviewerSlice]

const reviewerReducers = combineReducers(
  Object.assign({}, ...reviewerSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export const { injectSlices: injectReviewerSlices, resetSlices: resetReviewerSlices } =
  createSliceManager({
    reducerPath: "reviewer",
    reducer: reviewerReducers,
    middlewares: reviewerMiddlewareList,
    slices: reviewerSliceList,
  })
