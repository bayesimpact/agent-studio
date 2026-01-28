import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Project } from "./projects.models"
import { listProjects } from "./projects.thunks"

interface State {
  currentProjectId: string | null
  projects: Project[]
  createdProject: Project | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: State = {
  currentProjectId: null,
  projects: [],
  createdProject: null,
  status: "idle",
  error: null,
}

const slice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setCurrentProjectId: (state, action: PayloadAction<{ projectId: string | null }>) => {
      state.currentProjectId = action.payload.projectId
    },
    clearCreatedProject: (state) => {
      state.createdProject = null
    },
    clearProjects: (state) => {
      state.projects = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listProjects.pending, (state) => {
        if (state.status !== "succeeded") state.status = "loading"
        state.error = null
      })
      .addCase(listProjects.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.projects = action.payload
        state.error = null
      })
      .addCase(listProjects.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list projects"
      })
  },
})

export type { State as ProjectsState }
export const projectsInitialState = initialState
export const projectsActions = { ...slice.actions }
export const projectsSliceReducer = slice.reducer
