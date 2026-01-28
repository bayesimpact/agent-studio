import type { RootState } from "@/store"

export const selectLastNotification = (state: RootState) =>
  state.notifications.notifications[state.notifications.notifications.length - 1]
