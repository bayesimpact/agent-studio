import type {
  CreateProjectResponseDto,
  ListProjectsResponseDto,
} from "@caseai-connect/api-contracts"
import { createSlice } from "@reduxjs/toolkit"
import { createProject, deleteProject, listProjects, updateProject } from "./projects.thunks"

interface ProjectsState {
  projects: ListProjectsResponseDto["projects"] | null
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
        if (state.projects) {
          state.projects.unshift({
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

    builder
      .addCase(listProjects.pending, (state) => {
        if (state.status !== "succeeded") state.status = "loading"
        state.error = null
      })
      .addCase(listProjects.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.projects = action.payload.data.projects
        state.error = null
      })
      .addCase(listProjects.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to list projects"
      })

    builder
      .addCase(updateProject.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Update the project in the projects list
        if (state.projects) {
          const { projectId, payload } = action.meta.arg
          const projectIndex = state.projects.findIndex((p) => p.id === projectId)
          if (projectIndex !== -1) {
            const existingProject = state.projects[projectIndex]
            if (existingProject) {
              state.projects[projectIndex] = {
                id: existingProject.id,
                name: payload.name,
                organizationId: existingProject.organizationId,
                createdAt: existingProject.createdAt,
                updatedAt: Date.now(),
              }
            }
          }
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to update project"
      })

    builder
      .addCase(deleteProject.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        // Remove the project from the projects list
        if (state.projects) {
          state.projects = state.projects.filter((p) => p.id !== action.meta.arg)
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to delete project"
      })
  },
})

export const { clearCreatedProject, clearProjects } = projectsSlice.actions
