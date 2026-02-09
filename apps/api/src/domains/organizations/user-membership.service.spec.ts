import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/domains/organizations/organization.entity"
import {
  createOrganizationWithOwner,
  organizationFactory,
} from "@/domains/organizations/organization.factory"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { UserMembershipService } from "@/domains/organizations/user-membership.service"
import { User } from "@/domains/users/user.entity"

describe("UserMembershipService", () => {
  let service: UserMembershipService
  let membershipRepository: Repository<UserMembership>
  let organizationRepository: Repository<Organization>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let mainRepositories: {
    membershipRepository: Repository<UserMembership>
    organizationRepository: Repository<Organization>
    userRepository: Repository<User>
  }

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
    service = setup.module.get<UserMembershipService>(UserMembershipService)
    membershipRepository = setup.getRepository(UserMembership)
    organizationRepository = setup.getRepository(Organization)
    userRepository = setup.getRepository(User)
    mainRepositories = {
      membershipRepository,
      organizationRepository,
      userRepository,
    }
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("findUserMembership", () => {
    it("should return membership when user is a member of the organization", async () => {
      // Arrange
      const { user, organization } = await createOrganizationWithOwner(mainRepositories)

      // Act
      const result = await service.findUserMembership({
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
      const { user } = await createOrganizationWithOwner(mainRepositories, {
        user: { email: "nonmember@example.com" },
      })

      const { organization } = await createOrganizationWithOwner(mainRepositories, {
        organization: { name: "Other Org" },
      })

      // Act
      const result = await service.findUserMembership({
        userId: user.id,
        organizationId: organization.id,
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return null when organization does not exist", async () => {
      // Arrange
      const { user } = await createOrganizationWithOwner(mainRepositories, {
        user: { email: "user@example.com" },
      })

      const nonExistentOrganizationId = "00000000-0000-0000-0000-000000000000"

      // Act
      const result = await service.findUserMembership({
        userId: user.id,
        organizationId: nonExistentOrganizationId,
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return null when user does not exist", async () => {
      // Arrange
      const { organization } = await createOrganizationWithOwner(mainRepositories)

      const nonExistentUserId = "00000000-0000-0000-0000-000000000000"

      // Act
      const result = await service.findUserMembership({
        userId: nonExistentUserId,
        organizationId: organization.id,
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return the correct membership when user has multiple memberships", async () => {
      // Arrange
      const { user, organization: organization1 } = await createOrganizationWithOwner(
        mainRepositories,
        {
          user: { email: "multimember@example.com" },
          organization: { name: "Org 1" },
          membership: { role: "owner" },
        },
      )

      const savedOrganization2 = await organizationRepository.save(
        organizationFactory.build({ name: "Org 2" }),
      )
      await membershipRepository.save(
        userMembershipFactory
          .transient({ user, organization: savedOrganization2 })
          .member()
          .build(),
      )

      // Act
      const result1 = await service.findUserMembership({
        userId: user.id,
        organizationId: organization1.id,
      })
      const result2 = await service.findUserMembership({
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
