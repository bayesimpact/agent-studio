import { combineReducers } from "@reduxjs/toolkit"
import { createSliceManager } from "../../common/store/dynamic-middleware"
import { backofficeMiddleware } from "../features/backoffice/backoffice.middleware"
import { backofficeSlice } from "../features/backoffice/backoffice.slice"

const backofficeMiddlewareList = [backofficeMiddleware]

export const backofficeSliceList = [backofficeSlice]

const backofficeReducers = combineReducers(
  Object.assign({}, ...backofficeSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export const { injectSlices: injectBackofficeSlices, resetSlices: resetBackofficeSlices } =
  createSliceManager({
    reducerPath: "backoffice",
    reducer: backofficeReducers,
    middlewares: backofficeMiddlewareList,
    slices: backofficeSliceList,
  })
