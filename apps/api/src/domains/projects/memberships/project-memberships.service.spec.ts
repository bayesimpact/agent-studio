import { randomUUID } from "node:crypto"
import { NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { createUserMembership } from "@/domains/organizations/user-membership.factory"
import { userFactory } from "@/domains/users/user.factory"
import { ProjectsModule } from "../projects.module"
import type { ProjectMembership } from "./project-membership.entity"
import { createProjectMembership, projectMembershipFactory } from "./project-membership.factory"
import { ProjectMembershipsService } from "./project-memberships.service"

let ticketIdCounter = 0
const mockInvitationSender = {
  sendInvitation: jest.fn().mockImplementation(() => {
    ticketIdCounter += 1
    return Promise.resolve({ ticketId: `ticket_${ticketIdCounter}` })
  }),
}

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
      applyOverrides: (moduleBuilder) =>
        moduleBuilder.overrideProvider(INVITATION_SENDER).useValue(mockInvitationSender),
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
    ticketIdCounter = 0
    jest.clearAllMocks()
  })

  describe("findById", () => {
    it("should return a membership by its ID", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)
      const { membership } = await createProjectMembership({ repositories, organization, project })

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
      const { organization, project } = await createOrganizationWithProject(repositories)
      await createProjectMembership({ repositories, organization, project })

      const result = await service.listProjectMemberships(project.id)

      expect(result).toHaveLength(1)
      expect(result[0]!.user).toBeDefined()
      expect(result[0]!.user.email).toBe("invited@example.com")
      expect(result[0]!.user.name).toBe("Invited User")
    })

    it("should return memberships ordered by createdAt DESC", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const user1 = { email: "first@example.com", name: "First User" }
      await createProjectMembership({ repositories, organization, project, user: user1 })
      const user2 = { email: "second@example.com", name: "Second User" }
      await createProjectMembership({ repositories, organization, project, user: user2 })

      const result = await service.listProjectMemberships(project.id)

      expect(result).toHaveLength(2)
      expect(result[0]!.user.email).toBe("second@example.com")
      expect(result[1]!.user.email).toBe("first@example.com")
    })
  })

  describe("inviteProjectMembers", () => {
    it("should create a user and membership for a new email", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["new@example.com"],
        inviterName: "Admin",
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.user.email).toBe("new@example.com")
      expect(result[0]!.status).toBe("sent")
      // invitationToken is now the ticket_id returned by Auth0
      expect(result[0]!.invitationToken).toBe("ticket_1")

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

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["existing@example.com"],
        inviterName: "Admin",
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.userId).toBe(existingUser.id)
      expect(result[0]!.user.name).toBe("Existing User")
    })

    it("should skip if user is already a member", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const email = "already@example.com"
      await createProjectMembership({ repositories, organization, project, user: { email } })

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["already@example.com"],
        inviterName: "Admin",
      })

      expect(result).toHaveLength(0)
    })

    it("should handle multiple emails", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["a@example.com", "b@example.com", "c@example.com"],
        inviterName: "Admin",
      })

      expect(result).toHaveLength(3)
    })

    it("should normalize email addresses to lowercase", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["UPPER@EXAMPLE.COM"],
        inviterName: "Admin",
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.user.email).toBe("upper@example.com")
    })

    it("should call invitationSender.sendInvitation for each created membership", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["a@example.com", "b@example.com"],
        inviterName: "Admin User",
      })

      expect(mockInvitationSender.sendInvitation).toHaveBeenCalledTimes(2)

      expect(mockInvitationSender.sendInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteeEmail: "a@example.com",
          inviterName: "Admin User",
        }),
      )

      expect(mockInvitationSender.sendInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteeEmail: "b@example.com",
          inviterName: "Admin User",
        }),
      )
    })

    it("should not call invitationSender.sendInvitation for skipped duplicates", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)

      const email = "already@example.com"
      await createProjectMembership({ repositories, organization, project, user: { email } })

      await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["already@example.com"],
        inviterName: "Admin",
      })

      expect(mockInvitationSender.sendInvitation).not.toHaveBeenCalled()
    })
  })

  describe("acceptInvitation", () => {
    it("should accept an invitation and reconcile placeholder user", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      // Create a membership via invite
      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["invite@example.com"],
        inviterName: "Admin",
      })
      expect(result).toHaveLength(1)
      const membership = result[0]!

      const realAuth0Sub = "auth0|real-user-sub-123"

      const accepted = await service.acceptInvitation({
        ticketId: membership.invitationToken,
        auth0Sub: realAuth0Sub,
      })

      expect(accepted.status).toBe("accepted")

      // Verify user's auth0Id was reconciled (profile info is NOT set here — that's done by /me)
      const user = await repositories.userRepository.findOne({
        where: { id: membership.userId },
      })
      expect(user).toBeDefined()
      expect(user!.auth0Id).toBe(realAuth0Sub)
    })

    it("should create an organization membership for the user", async () => {
      const { project, organization } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["invite@example.com"],
        inviterName: "Admin",
      })
      const membership = result[0]!

      await service.acceptInvitation({
        ticketId: membership.invitationToken,
        auth0Sub: "auth0|new-user",
      })

      // Verify organization membership was created
      const orgMembership = await repositories.membershipRepository.findOne({
        where: { userId: membership.userId, organizationId: organization.id },
      })
      expect(orgMembership).toBeDefined()
      expect(orgMembership!.role).toBe("member")
    })

    it("should not duplicate organization membership if one already exists", async () => {
      const { project, organization } = await createOrganizationWithProject(repositories)

      // Create a real user who is already a member of the org
      const { user: existingUser } = await createUserMembership({
        repositories,
        organization,
        user: { email: "existing@example.com", auth0Id: "auth0|existing" },
      })

      // Create a project membership for this user
      const membership = projectMembershipFactory
        .transient({ project, user: existingUser })
        .build({ invitationToken: "ticket_existing_org_member" })
      await projectMembershipRepository.save(membership)

      await service.acceptInvitation({
        ticketId: "ticket_existing_org_member",
        auth0Sub: "auth0|existing",
      })

      // Verify there's still only one org membership and role wasn't changed
      const orgMemberships = await repositories.membershipRepository.find({
        where: { userId: existingUser.id, organizationId: organization.id },
      })
      expect(orgMemberships).toHaveLength(1)
      expect(orgMemberships[0]!.role).toBe("member")
    })

    it("should return the membership if already accepted", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["invite@example.com"],
        inviterName: "Admin",
      })
      const membership = result[0]!

      // Accept once
      await service.acceptInvitation({
        ticketId: membership.invitationToken,
        auth0Sub: "auth0|user",
      })

      // Accept again — should not throw
      const secondAccept = await service.acceptInvitation({
        ticketId: membership.invitationToken,
        auth0Sub: "auth0|user",
      })

      expect(secondAccept.status).toBe("accepted")
    })

    it("should throw NotFoundException for unknown ticketId", async () => {
      await expect(
        service.acceptInvitation({ ticketId: "non-existent-ticket", auth0Sub: "auth0|user" }),
      ).rejects.toThrow(NotFoundException)
    })

    it("should not overwrite auth0Id if user is not a placeholder", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      // Create a real user first
      const realUser = userFactory.build({
        email: "real@example.com",
        auth0Id: "auth0|original-id",
        name: "Original Name",
      })
      await repositories.userRepository.save(realUser)

      // Create membership for the real user
      const membership = projectMembershipFactory
        .transient({ project, user: realUser })
        .build({ invitationToken: "ticket_existing" })
      await projectMembershipRepository.save(membership)

      await service.acceptInvitation({
        ticketId: "ticket_existing",
        auth0Sub: "auth0|different-id",
      })

      // Verify auth0Id was NOT changed (not a placeholder)
      const user = await repositories.userRepository.findOne({
        where: { id: realUser.id },
      })
      expect(user!.auth0Id).toBe("auth0|original-id")
    })
  })

  describe("removeProjectMembership", () => {
    it("should remove a membership", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const { membership } = await createProjectMembership({ repositories, project })

      await service.removeProjectMembership({ membershipId: membership.id, projectId: project.id })

      const deletedMembership = await projectMembershipRepository.findOne({
        where: { id: membership.id },
      })
      expect(deletedMembership).toBeNull()
    })

    it("should also delete the placeholder user when removing a pending invitation", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      // Create a membership via invite (creates a placeholder user)
      const result = await service.inviteProjectMembers({
        projectId: project.id,
        emails: ["placeholder@example.com"],
        inviterName: "Admin",
      })
      const membership = result[0]!

      await service.removeProjectMembership({ membershipId: membership.id, projectId: project.id })

      // Verify the membership is deleted
      const deletedMembership = await projectMembershipRepository.findOne({
        where: { id: membership.id },
      })
      expect(deletedMembership).toBeNull()

      // Verify the placeholder user is also deleted
      const deletedUser = await repositories.userRepository.findOne({
        where: { id: membership.userId },
      })
      expect(deletedUser).toBeNull()
    })

    it("should NOT delete a real user when removing a membership", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      const { invitedUser: realUser, membership } = await createProjectMembership({
        repositories,
        project,
        user: { email: "real@example.com", auth0Id: "auth0|real-user" },
      })

      await service.removeProjectMembership({ membershipId: membership.id, projectId: project.id })

      // Verify the membership is deleted
      const deletedMembership = await projectMembershipRepository.findOne({
        where: { id: membership.id },
      })
      expect(deletedMembership).toBeNull()

      // Verify the real user is NOT deleted
      const user = await repositories.userRepository.findOne({
        where: { id: realUser.id },
      })
      expect(user).toBeDefined()
      expect(user!.auth0Id).toBe("auth0|real-user")
    })
  })
})
