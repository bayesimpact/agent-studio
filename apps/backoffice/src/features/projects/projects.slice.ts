import type {
  CreateProjectResponseDto,
  ListProjectsResponseDto,
} from "@caseai-connect/api-contracts"
import { createSlice } from "@reduxjs/toolkit"
import { createProject, listProjects } from "./projects.thunks"

interface ProjectsState {
  projects: ListProjectsResponseDto | null
  createdProject: CreateProjectResponseDto | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: ProjectsState = {
  projects: null,
  createdProject: null,
  status: "idle",
  error: null,
}

export const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearCreatedProject: (state) => {
      state.createdProject = null
    },
    clearProjects: (state) => {
      state.projects = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProject.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.createdProject = action.payload.data
        state.error = null
      })
      .addCase(createProject.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to create project"
      })
      .addCase(listProjects.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(listProjects.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.projects = action.payload.data
        state.error = null
      })
      .addCase(listProjects.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list projects"
      })
  },
})

export const { clearCreatedProject, clearProjects } = projectsSlice.actions
