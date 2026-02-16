import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { InviteProjectMembersPayload, ProjectMembership } from "./project-memberships.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listProjectMemberships = createAsyncThunk<
  ProjectMembership[],
  { organizationId: string; projectId: string },
  ThunkConfig
>(
  "projectMemberships/list",
  async ({ organizationId, projectId }, { extra: { services } }) =>
    await services.projectMemberships.getAll(organizationId, projectId),
)

export const inviteProjectMembers = createAsyncThunk<
  ProjectMembership[],
  {
    organizationId: string
    projectId: string
    payload: InviteProjectMembersPayload
  },
  ThunkConfig
>(
  "projectMemberships/invite",
  async ({ organizationId, projectId, payload }, { extra: { services } }) =>
    await services.projectMemberships.invite(organizationId, projectId, payload),
)

export const removeProjectMembership = createAsyncThunk<
  void,
  {
    organizationId: string
    projectId: string
    membershipId: string
  },
  ThunkConfig
>(
  "projectMemberships/remove",
  async ({ organizationId, projectId, membershipId }, { extra: { services } }) =>
    await services.projectMemberships.remove(organizationId, projectId, membershipId),
)
