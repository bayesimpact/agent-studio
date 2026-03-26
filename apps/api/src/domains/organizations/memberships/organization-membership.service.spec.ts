import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { organizationMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { OrganizationMembershipService } from "@/domains/organizations/memberships/organization-membership.service"
import {
  createOrganizationWithOwner,
  organizationFactory,
} from "@/domains/organizations/organization.factory"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"

describe("OrganizationMembershipService", () => {
  let service: OrganizationMembershipService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [OrganizationsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    service = setup.module.get<OrganizationMembershipService>(OrganizationMembershipService)
    repositories = setup.getAllRepositories()
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("findOrganizationMembership", () => {
    it("should return membership when user is a member of the organization", async () => {
      // Arrange
      const { user, organization } = await createOrganizationWithOwner(repositories)

      // Act
      const result = await service.findOrganizationMembership({
        userId: user.id,
        organizationId: organization.id,
      })

      // Assert
      expect(result).not.toBeNull()
      expect(result?.userId).toBe(user.id)
      expect(result?.organizationId).toBe(organization.id)
      expect(result?.role).toBeDefined()
    })

    it("should return null when user is not a member of the organization", async () => {
      // Arrange
      const { user } = await createOrganizationWithOwner(repositories, {
        user: { email: "nonmember@example.com" },
      })

      const { organization } = await createOrganizationWithOwner(repositories, {
        organization: { name: "Other Org" },
      })

      // Act
      const result = await service.findOrganizationMembership({
        userId: user.id,
        organizationId: organization.id,
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return null when organization does not exist", async () => {
      // Arrange
      const { user } = await createOrganizationWithOwner(repositories, {
        user: { email: "user@example.com" },
      })

      const nonExistentOrganizationId = "00000000-0000-0000-0000-000000000000"

      // Act
      const result = await service.findOrganizationMembership({
        userId: user.id,
        organizationId: nonExistentOrganizationId,
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return null when user does not exist", async () => {
      // Arrange
      const { organization } = await createOrganizationWithOwner(repositories)

      const nonExistentUserId = "00000000-0000-0000-0000-000000000000"

      // Act
      const result = await service.findOrganizationMembership({
        userId: nonExistentUserId,
        organizationId: organization.id,
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return the correct membership when user has multiple memberships", async () => {
      // Arrange
      const { user, organization: organization1 } = await createOrganizationWithOwner(
        repositories,
        {
          user: { email: "multimember@example.com" },
          organization: { name: "Org 1" },
          organizationMembership: { role: "owner" },
        },
      )

      const savedOrganization2 = await repositories.organizationRepository.save(
        organizationFactory.build({ name: "Org 2" }),
      )
      await repositories.organizationMembershipRepository.save(
        organizationMembershipFactory
          .transient({ user, organization: savedOrganization2 })
          .member()
          .build(),
      )

      // Act
      const result1 = await service.findOrganizationMembership({
        userId: user.id,
        organizationId: organization1.id,
      })
      const result2 = await service.findOrganizationMembership({
        userId: user.id,
        organizationId: savedOrganization2.id,
      })

      // Assert
      expect(result1).not.toBeNull()
      expect(result1?.organizationId).toBe(organization1.id)
      expect(result1?.role).toBe("owner")

      expect(result2).not.toBeNull()
      expect(result2?.organizationId).toBe(savedOrganization2.id)
      expect(result2?.role).toBe("member")
    })
  })
})
