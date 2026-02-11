import {
  type InviteProjectMembersRequestDto,
  type InviteProjectMembersResponseDto,
  type ListProjectMembershipsResponseDto,
  ProjectsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { InviteProjectMembersPayload, ProjectMembership } from "../project-memberships.models"
import type { IProjectMembershipsSpi } from "../project-memberships.spi"

export default {
  getAll: async (organizationId: string, projectId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ProjectsRoutes.listProjectMemberships.response>(
      ProjectsRoutes.listProjectMemberships.getPath({ organizationId, projectId }),
    )
    return fromListDto(response.data.data)
  },
  invite: async (
    organizationId: string,
    projectId: string,
    payload: InviteProjectMembersPayload,
  ) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ProjectsRoutes.inviteProjectMembers.response>(
      ProjectsRoutes.inviteProjectMembers.getPath({ organizationId, projectId }),
      {
        payload: toInviteDto(payload),
      },
    )
    return fromListDto(response.data.data)
  },
  remove: async (organizationId: string, projectId: string, membershipId: string) => {
    const axios = getAxiosInstance()
    await axios.delete(
      ProjectsRoutes.removeProjectMembership.getPath({ organizationId, projectId, membershipId }),
    )
  },
} satisfies IProjectMembershipsSpi

const toInviteDto = (payload: InviteProjectMembersPayload): InviteProjectMembersRequestDto => ({
  emails: payload.emails,
})

const fromListDto = (
  dto: ListProjectMembershipsResponseDto | InviteProjectMembersResponseDto,
): ProjectMembership[] =>
  dto.memberships.map((membership) => ({
    id: membership.id,
    projectId: membership.projectId,
    userId: membership.userId,
    userName: membership.userName,
    userEmail: membership.userEmail,
    status: membership.status,
    createdAt: membership.createdAt,
  }))
