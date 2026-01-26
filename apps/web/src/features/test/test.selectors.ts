import type { RootState } from "@/store"

export const selectHelloMessage = (state: RootState) => state.test.helloMessage
export const selectTestStatus = (state: RootState) => state.test.status
export const selectTestError = (state: RootState) => state.test.error
