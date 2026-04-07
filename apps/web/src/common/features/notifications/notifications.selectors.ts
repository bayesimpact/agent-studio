import type { RootState } from "@/common/store"

export const selectLastNotification = (state: RootState) =>
  state.notifications.notifications[state.notifications.notifications.length - 1]
