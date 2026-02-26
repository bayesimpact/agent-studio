import {
  type InviteProjectMembersResponseDto,
  type ListProjectMembershipsResponseDto,
  ProjectsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ProjectMembership } from "../project-memberships.models"
import type { IProjectMembershipsSpi } from "../project-memberships.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ProjectsRoutes.listProjectMemberships.response>(
      ProjectsRoutes.listProjectMemberships.getPath({ organizationId, projectId }),
    )
    return fromListDto(response.data.data)
  },
  invite: async ({ organizationId, projectId, emails }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ProjectsRoutes.inviteProjectMembers.response>(
      ProjectsRoutes.inviteProjectMembers.getPath({ organizationId, projectId }),
      { payload: { emails } },
    )
    return fromListDto(response.data.data)
  },
  remove: async ({ organizationId, projectId, membershipId }) => {
    const axios = getAxiosInstance()
    await axios.delete(
      ProjectsRoutes.removeProjectMembership.getPath({ organizationId, projectId, membershipId }),
    )
  },
} satisfies IProjectMembershipsSpi

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
