import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { User } from "@/domains/users/user.entity"
import { userFactory } from "@/domains/users/user.factory"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
import { OrganizationMembership } from "./memberships/organization-membership.entity"
import { Organization } from "./organization.entity"
import { organizationFactory } from "./organization.factory"
import { OrganizationsModule } from "./organizations.module"
import { OrganizationsService } from "./organizations.service"

describe("OrganizationsService", () => {
  let service: OrganizationsService
  let organizationRepository: Repository<Organization>
  let organizationMembershipRepository: Repository<OrganizationMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [OrganizationsModule],
    })
    // Clear database once at the start to ensure clean state
    // Individual tests use transactions with rollback for isolation
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    // Start transaction - this creates a new module with transactional providers
    await setup.startTransaction()
    // Get service and repositories from transactional module
    service = setup.module.get<OrganizationsService>(OrganizationsService)
    organizationRepository = setup.getRepository(Organization)
    organizationMembershipRepository = setup.getRepository(OrganizationMembership)
    setup.getRepository(FeatureFlag)
    userRepository = setup.getRepository(User)
  })

  afterEach(async () => {
    // Rollback transaction - automatically cleans up all data
    await setup.rollbackTransaction()
  })

  describe("createOrganization", () => {
    it("should create a new organization and membership with owner role", async () => {
      // Arrange
      const user = userFactory.build({
        email: "test@example.com",
      })
      const savedUser = await userRepository.save(user)

      // Act
      const result = await service.createOrganization(savedUser.id, "Test Organization")

      // Assert
      expect(result.organization.name).toBe("Test Organization")
      expect(result.role).toBe("owner")
      expect(result.organization.id).toBeDefined()
      expect(result.organization.createdAt).toBeInstanceOf(Date)

      // Verify organization was saved
      const savedOrganization = await organizationRepository.findOne({
        where: { id: result.organization.id },
      })
      expect(savedOrganization).not.toBeNull()
      expect(savedOrganization?.name).toBe("Test Organization")

      // Verify membership was created with owner role
      const membership = await organizationMembershipRepository.findOne({
        where: {
          userId: savedUser.id,
          organizationId: result.organization.id,
        },
      })
      expect(membership).not.toBeNull()
      expect(membership?.role).toBe("owner")
    })

    it("should create organization with correct user membership relationship", async () => {
      // Arrange
      const user = userFactory.build({
        email: "user@example.com",
      })
      const savedUser = await userRepository.save(user)

      // Act
      const { organization } = await service.createOrganization(savedUser.id, "My Org")

      // Assert - Verify the membership links user and organization correctly
      const membership = await organizationMembershipRepository.findOne({
        where: {
          userId: savedUser.id,
          organizationId: organization.id,
        },
        relations: ["user", "organization"],
      })
      expect(membership).not.toBeNull()
      expect(membership?.user.id).toBe(savedUser.id)
      expect(membership?.organization.id).toBe(organization.id)
    })

    it("should allow multiple organizations to be created", async () => {
      // Arrange
      const user = userFactory.build({
        email: "multi@example.com",
      })
      const savedUser = await userRepository.save(user)

      // Act
      const result1 = await service.createOrganization(savedUser.id, "Org 1")
      const result2 = await service.createOrganization(savedUser.id, "Org 2")

      // Assert
      expect(result1.organization.name).toBe("Org 1")
      expect(result2.organization.name).toBe("Org 2")
      expect(result1.organization.id).not.toBe(result2.organization.id)

      // Verify both memberships exist
      const memberships = await organizationMembershipRepository.find({
        where: { userId: savedUser.id },
      })
      expect(memberships).toHaveLength(2)
      expect(memberships.every((m) => m.role === "owner")).toBe(true)
    })

    it("should create organization with unique IDs", async () => {
      // Arrange
      const user = userFactory.build({
        email: "unique@example.com",
      })
      const savedUser = await userRepository.save(user)

      // Act
      const result1 = await service.createOrganization(savedUser.id, "Unique Org 1")
      const result2 = await service.createOrganization(savedUser.id, "Unique Org 2")

      // Assert
      expect(result1.organization.id).not.toBe(result2.organization.id)
      expect(result1.organization.id).toBeDefined()
      expect(result2.organization.id).toBeDefined()
    })

    it("should create organization with timestamps", async () => {
      // Arrange
      const user = userFactory.build({
        email: "timestamp@example.com",
      })
      const savedUser = await userRepository.save(user)

      // Act
      const { organization } = await service.createOrganization(savedUser.id, "Timestamp Org")

      // Assert
      expect(organization.createdAt).toBeInstanceOf(Date)
      expect(organization.updatedAt).toBeInstanceOf(Date)
      expect(organization.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe("getUserOrganizationsWithMemberships", () => {
    it("should return empty array when user has no organizations", async () => {
      // Arrange
      const user = userFactory.build({
        email: "noorgs@example.com",
      })
      const savedUser = await userRepository.save(user)

      // Act
      const result = await service.getUserOrganizationsWithMemberships(savedUser.id)

      // Assert
      expect(result).toEqual([])
    })

    it("should return organizations with correct roles", async () => {
      // Arrange
      const user = userFactory.build({
        email: "withorgs@example.com",
      })
      const savedUser = await userRepository.save(user)

      const org1 = organizationFactory.build({ name: "Org 1" })
      const savedOrg1 = await organizationRepository.save(org1)

      const org2 = organizationFactory.build({ name: "Org 2" })
      const savedOrg2 = await organizationRepository.save(org2)

      const membership1 = organizationMembershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg1.id,
        role: "owner",
      })
      await organizationMembershipRepository.save(membership1)

      const membership2 = organizationMembershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg2.id,
        role: "member",
      })
      await organizationMembershipRepository.save(membership2)

      // Act
      const result = await service.getUserOrganizationsWithMemberships(savedUser.id)

      // Assert
      expect(result).toHaveLength(2)
      // Note: memberships relation is not loaded, so it will be undefined
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            organization: expect.objectContaining({
              id: savedOrg1.id,
              name: savedOrg1.name,
            }),
            role: "owner",
          }),
          expect.objectContaining({
            organization: expect.objectContaining({
              id: savedOrg2.id,
              name: savedOrg2.name,
            }),
            role: "member",
          }),
        ]),
      )
    })
  })
})
