import { randomUUID } from "node:crypto"
import { NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "./project.factory"
import type { ProjectMembership } from "./project-membership.entity"
import { projectMembershipFactory } from "./project-membership.factory"
import { ProjectMembershipsService } from "./project-memberships.service"
import { ProjectsModule } from "./projects.module"

describe("ProjectMembershipsService", () => {
  let service: ProjectMembershipsService
  let projectMembershipRepository: Repository<ProjectMembership>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsModule],
    })
    await clearTestDatabase(setup.dataSource)
    repositories = setup.getAllRepositories()
    projectMembershipRepository = repositories.projectMembershipRepository
    service = setup.module.get<ProjectMembershipsService>(ProjectMembershipsService)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  afterEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  describe("findById", () => {
    it("should return a membership by its ID", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const invitedUser = userFactory.build({ email: "findme@example.com" })
      await repositories.userRepository.save(invitedUser)

      const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
      await projectMembershipRepository.save(membership)

      const result = await service.findById(membership.id)

      expect(result).toBeDefined()
      expect(result!.id).toBe(membership.id)
    })

    it("should return null for non-existent membership", async () => {
      const result = await service.findById(randomUUID())

      expect(result).toBeNull()
    })
  })

  describe("listProjectMemberships", () => {
    it("should return empty list when no memberships exist", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.listProjectMemberships(project.id)

      expect(result).toEqual([])
    })

    it("should return memberships with user relations", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const invitedUser = userFactory.build({
        email: "invited@example.com",
        name: "Invited User",
      })
      await repositories.userRepository.save(invitedUser)

      const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
      await projectMembershipRepository.save(membership)

      const result = await service.listProjectMemberships(project.id)

      expect(result).toHaveLength(1)
      expect(result[0]!.user).toBeDefined()
      expect(result[0]!.user.email).toBe("invited@example.com")
      expect(result[0]!.user.name).toBe("Invited User")
    })

    it("should return memberships ordered by createdAt DESC", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const user1 = userFactory.build({ email: "first@example.com" })
      const user2 = userFactory.build({ email: "second@example.com" })
      await repositories.userRepository.save([user1, user2])

      const membership1 = projectMembershipFactory
        .transient({ project, user: user1 })
        .build({ createdAt: new Date("2024-01-01") })
      const membership2 = projectMembershipFactory
        .transient({ project, user: user2 })
        .build({ createdAt: new Date("2024-01-02") })
      await projectMembershipRepository.save([membership1, membership2])

      const result = await service.listProjectMemberships(project.id)

      expect(result).toHaveLength(2)
      expect(result[0]!.user.email).toBe("second@example.com")
      expect(result[1]!.user.email).toBe("first@example.com")
    })
  })

  describe("inviteProjectMembers", () => {
    it("should create a user and membership for a new email", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers(project.id, ["new@example.com"])

      expect(result).toHaveLength(1)
      expect(result[0]!.user.email).toBe("new@example.com")
      expect(result[0]!.status).toBe("sent")
      expect(result[0]!.invitationToken).toBeDefined()

      // Verify user was created with placeholder auth0Id prefix
      const createdUser = await repositories.userRepository.findOne({
        where: { email: "new@example.com" },
      })
      expect(createdUser).toBeDefined()
      expect(createdUser!.auth0Id).toMatch(/^00000000-0000-0000-0000-/)
    })

    it("should create only a membership for an existing user", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const existingUser = userFactory.build({
        email: "existing@example.com",
        name: "Existing User",
      })
      await repositories.userRepository.save(existingUser)

      const result = await service.inviteProjectMembers(project.id, ["existing@example.com"])

      expect(result).toHaveLength(1)
      expect(result[0]!.userId).toBe(existingUser.id)
      expect(result[0]!.user.name).toBe("Existing User")
    })

    it("should skip if user is already a member", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const existingUser = userFactory.build({ email: "already@example.com" })
      await repositories.userRepository.save(existingUser)

      const membership = projectMembershipFactory.transient({ project, user: existingUser }).build()
      await projectMembershipRepository.save(membership)

      const result = await service.inviteProjectMembers(project.id, ["already@example.com"])

      expect(result).toHaveLength(0)
    })

    it("should handle multiple emails", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers(project.id, [
        "a@example.com",
        "b@example.com",
        "c@example.com",
      ])

      expect(result).toHaveLength(3)
    })

    it("should normalize email addresses to lowercase", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers(project.id, ["UPPER@EXAMPLE.COM"])

      expect(result).toHaveLength(1)
      expect(result[0]!.user.email).toBe("upper@example.com")
    })
  })

  describe("removeProjectMembership", () => {
    it("should remove a membership", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const invitedUser = userFactory.build({ email: "remove@example.com" })
      await repositories.userRepository.save(invitedUser)

      const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
      await projectMembershipRepository.save(membership)

      await service.removeProjectMembership(membership.id, project.id)

      const deletedMembership = await projectMembershipRepository.findOne({
        where: { id: membership.id },
      })
      expect(deletedMembership).toBeNull()
    })

    it("should throw NotFoundException for non-existent membership", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      await expect(service.removeProjectMembership(randomUUID(), project.id)).rejects.toThrow(
        NotFoundException,
      )
    })

    it("should throw NotFoundException if membership belongs to a different project", async () => {
      const { project, organization } = await createOrganizationWithProject(repositories)

      const otherProject = projectFactory.transient({ organization }).build()
      await repositories.projectRepository.save(otherProject)

      const invitedUser = userFactory.build({ email: "other@example.com" })
      await repositories.userRepository.save(invitedUser)

      const membership = projectMembershipFactory
        .transient({ project: otherProject, user: invitedUser })
        .build()
      await projectMembershipRepository.save(membership)

      await expect(service.removeProjectMembership(membership.id, project.id)).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
