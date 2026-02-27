import { type ProjectMembershipDto, ProjectsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ProjectMembership } from "../project-memberships.models"
import type { IProjectMembershipsSpi } from "../project-memberships.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ProjectsRoutes.listProjectMemberships.response>(
      ProjectsRoutes.listProjectMemberships.getPath({ organizationId, projectId }),
    )
    return response.data.data.map(fromDto)
  },
  invite: async ({ organizationId, projectId, emails }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ProjectsRoutes.inviteProjectMembers.response>(
      ProjectsRoutes.inviteProjectMembers.getPath({ organizationId, projectId }),
      { payload: { emails } },
    )
    return response.data.data.map(fromDto)
  },
  remove: async ({ organizationId, projectId, membershipId }) => {
    const axios = getAxiosInstance()
    await axios.delete(
      ProjectsRoutes.removeProjectMembership.getPath({ organizationId, projectId, membershipId }),
    )
  },
} satisfies IProjectMembershipsSpi

const fromDto = (dto: ProjectMembershipDto): ProjectMembership => ({
  id: dto.id,
  projectId: dto.projectId,
  userId: dto.userId,
  userName: dto.userName,
  userEmail: dto.userEmail,
  status: dto.status,
  createdAt: dto.createdAt,
})
