import type {
  CreateProjectResponseDto,
  ListProjectsResponseDto,
} from "@caseai-connect/api-contracts"
import { createSlice } from "@reduxjs/toolkit"
import { createProject, deleteProject, listProjects, updateProject } from "./projects.thunks"

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
        // Add the new project to the projects list
        if (state.projects?.projects) {
          state.projects.projects.unshift({
            id: action.payload.data.id,
            name: action.payload.data.name,
            organizationId: action.payload.data.organizationId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
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
      .addCase(updateProject.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Update the project in the projects list
        if (state.projects?.projects) {
          const projectIndex = state.projects.projects.findIndex(
            (p) => p.id === action.payload.data.id,
          )
          if (projectIndex !== -1) {
            state.projects.projects[projectIndex] = {
              ...state.projects.projects[projectIndex],
              name: action.payload.data.name,
              updatedAt: Date.now(),
            }
          }
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to update project"
      })
      .addCase(deleteProject.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Remove the project from the projects list
        if (state.projects?.projects) {
          state.projects.projects = state.projects.projects.filter((p) => p.id !== action.meta.arg)
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to delete project"
      })
  },
})

export const { clearCreatedProject, clearProjects } = projectsSlice.actions
