import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/common/store/types"

// Create typed listener middleware
const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

// FIXME:
function registerListeners() {}

export const studioProjectsMiddleware = { listenerMiddleware, registerListeners }
