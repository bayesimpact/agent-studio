import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "../me/me.models"

interface State {
  isAuthenticated: boolean
  isAdminInterface: boolean
  abilities: {
    canManageOrganizations: boolean
    canManageProjects: boolean
    canReadAgent: boolean
  }
}

const initialState: State = {
  isAuthenticated: false,
  isAdminInterface: false,
  abilities: {
    canManageOrganizations: false,
    canManageProjects: false,
    canReadAgent: false,
  },
}

const adminRoles = ["admin", "owner"]
const roles = [...adminRoles, "member"]
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setCanManageOrganizations: (
      state,
      action: PayloadAction<{
        organizationRole?: User["memberships"]["organizationMemberships"][number]["role"]
      }>,
    ) => {
      state.abilities.canManageOrganizations = !!(
        action.payload.organizationRole && adminRoles.includes(action.payload.organizationRole)
      )
    },
    setCanManageProjects: (
      state,
      action: PayloadAction<{
        projectRole?: User["memberships"]["projectMemberships"][number]["role"]
      }>,
    ) => {
      state.abilities.canManageProjects = !!(
        action.payload.projectRole && adminRoles.includes(action.payload.projectRole)
      )
    },
    setCanReadAgent: (
      state,
      action: PayloadAction<{
        agentRole?: User["memberships"]["agentMemberships"][number]["role"]
      }>,
    ) => {
      state.abilities.canReadAgent = !!(
        action.payload.agentRole && roles.includes(action.payload.agentRole)
      )
    },
    setIsAdminInterface: (state, action: PayloadAction<boolean>) => {
      if (state.abilities.canManageOrganizations || state.abilities.canManageProjects) {
        state.isAdminInterface = action.payload
      } else {
        state.isAdminInterface = false
      }
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSliceReducer = slice.reducer
