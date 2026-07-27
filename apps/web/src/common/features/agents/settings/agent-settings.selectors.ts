import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/common/store"
import { ADS } from "@/common/store/async-data-status"

export const selectAgentSettingsData = (state: RootState) => state.agentSettings.data

export const selectLastAgentSettings = createSelector([selectAgentSettingsData], (data) =>
  ADS.isFulfilled(data) ? (data.value[0] ?? null) : null,
)

export const selectLastPublishedAgentSettings = createSelector([selectAgentSettingsData], (data) =>
  ADS.isFulfilled(data)
    ? (data.value.find((agentSettings) => !agentSettings.isDraft) ?? null)
    : null,
)
