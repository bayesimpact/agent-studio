import type { Repository } from "typeorm"
import { In } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { User } from "@/users/user.entity"
import { Organization } from "./organization.entity"
import { OrganizationsController } from "./organizations.controller"
import { OrganizationsModule } from "./organizations.module"
import { UserMembership } from "./user-membership.entity"

describe("OrganizationsController", () => {
  let controller: OrganizationsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>

  beforeAll(async () => {
    // Use transactional setup with OrganizationsModule import
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership],
      [],
      [OrganizationsModule],
    )
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
    // Get controller and repositories from transactional module (important!)
    controller = setup.module.get<OrganizationsController>(OrganizationsController)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
  })

  afterEach(async () => {
    // Rollback transaction - automatically cleans up all data
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createOrganization", () => {
    it("should create organization and make user owner", async () => {
      // Arrange
      const auth0Sub = "auth0|org-123456"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "test@example.com",
          name: "Test User",
          picture: "https://example.com/picture.jpg",
        },
      }
      const body = {
        payload: {
          name: "New Organization",
        },
      }

      // Act
      const { data: result } = await controller.createOrganization(mockRequest, body)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.name).toBe("New Organization")
      expect(result.role).toBe("owner")

      // Verify organization was created
      const organization = await organizationRepository.findOne({
        where: { id: result.id },
      })
      expect(organization).not.toBeNull()
      expect(organization?.name).toBe("New Organization")

      // Verify user was created and is owner
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user).not.toBeNull()

      if (user) {
        const membership = await membershipRepository.findOne({
          where: {
            userId: user.id,
            organizationId: result.id,
          },
        })
        expect(membership).not.toBeNull()
        expect(membership?.role).toBe("owner")
      }
    })

    it("should create user if not exists", async () => {
      // Arrange
      const auth0Sub = "auth0|org-new-user"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "newuser@example.com",
          name: "New User",
        },
      }
      const body = {
        payload: {
          name: "First Organization",
        },
      }

      // Act
      const { data: result } = await controller.createOrganization(mockRequest, body)

      // Assert - User should be created
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user).not.toBeNull()
      expect(user?.email).toBe("newuser@example.com")
      expect(user?.name).toBe("New User")

      // Organization should be created
      expect(result.id).toBeDefined()
      expect(result.name).toBe("First Organization")
    })

    it("should reuse existing user", async () => {
      // Arrange
      const auth0Sub = "auth0|org-existing"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "existing@example.com",
          name: "Existing User",
        },
      }
      const body1 = {
        payload: {
          name: "First Org",
        },
      }
      const body2 = {
        payload: {
          name: "Second Org",
        },
      }

      // Act - Create first organization
      const { data: result1 } = await controller.createOrganization(mockRequest, body1)
      const userId1 = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })

      // Act - Create second organization
      const { data: result2 } = await controller.createOrganization(mockRequest, body2)
      const userId2 = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })

      // Assert - Same user ID (idempotent)
      expect(userId1?.id).toBe(userId2?.id)

      // Both organizations should exist
      expect(result1.id).toBeDefined()
      expect(result2.id).toBeDefined()
      expect(result1.id).not.toBe(result2.id)

      // Both should have owner role
      expect(result1.role).toBe("owner")
      expect(result2.role).toBe("owner")
    })

    it("should return organization in correct format", async () => {
      // Arrange
      const auth0Sub = "auth0|org-format-test"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "format@example.com",
        },
      }
      const body = {
        payload: {
          name: "Format Test Org",
        },
      }

      // Act
      const response = await controller.createOrganization(mockRequest, body)

      // Assert - Check format matches expected DTO structure
      expect(response.data).toEqual({
        id: expect.any(String),
        name: "Format Test Org",
        role: "owner",
      })
      expect(response.data).not.toHaveProperty("organization")
      expect(response.data).not.toHaveProperty("createdAt")
      expect(response.data).not.toHaveProperty("updatedAt")
    })

    it("should create membership with owner role for current user", async () => {
      // Arrange
      const auth0Sub = "auth0|org-owner-test"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
        },
      }
      const body = {
        payload: {
          name: "Owner Test Org",
        },
      }

      // Act
      const { data: result } = await controller.createOrganization(mockRequest, body)

      // Assert - Verify membership exists with owner role
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user).not.toBeNull()

      if (user) {
        const membership = await membershipRepository.findOne({
          where: {
            userId: user.id,
            organizationId: result.id,
          },
        })
        expect(membership).not.toBeNull()
        expect(membership?.role).toBe("owner")
      }
    })

    it("should handle different organization names", async () => {
      // Arrange
      const auth0Sub = "auth0|org-multi-org"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "multi@example.com",
        },
      }

      // Act
      const org1 = await controller.createOrganization(mockRequest, {
        payload: { name: "Organization A" },
      })
      const org2 = await controller.createOrganization(mockRequest, {
        payload: { name: "Organization B" },
      })
      const org3 = await controller.createOrganization(mockRequest, {
        payload: { name: "My Company" },
      })

      // Assert
      expect(org1.data.name).toBe("Organization A")
      expect(org2.data.name).toBe("Organization B")
      expect(org3.data.name).toBe("My Company")

      // All should have unique IDs
      const ids = [org1.data.id, org2.data.id, org3.data.id]
      expect(new Set(ids).size).toBe(3)

      // Verify all are saved
      const organizations = await organizationRepository.find({
        where: { id: In(ids) },
      })
      expect(organizations.length).toBe(3)
    })

    it("should reject organization name shorter than 3 characters", async () => {
      // Arrange
      const auth0Sub = "auth0|org-validation"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "validation@example.com",
        },
      }
      const body = {
        payload: {
          name: "AB", // Only 2 characters
        },
      }

      // Act & Assert - ValidationPipe will throw BadRequestException
      await expect(controller.createOrganization(mockRequest, body)).rejects.toThrow()
    })

    it("should reject empty organization name", async () => {
      // Arrange
      const auth0Sub = "auth0|org-empty"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "empty@example.com",
        },
      }
      const body = {
        payload: {
          name: "",
        },
      }

      // Act & Assert - ValidationPipe will throw BadRequestException
      await expect(controller.createOrganization(mockRequest, body)).rejects.toThrow()
    })

    it("should accept organization name with exactly 3 characters", async () => {
      // Arrange
      const auth0Sub = "auth0|org-exact"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "exact@example.com",
        },
      }
      const body = {
        payload: {
          name: "ABC", // Exactly 3 characters
        },
      }

      // Act
      const { data: result } = await controller.createOrganization(mockRequest, body)

      // Assert
      expect(result.name).toBe("ABC")
      expect(result.id).toBeDefined()
    })

    it("should reject organization name with only whitespace", async () => {
      // Arrange
      const auth0Sub = "auth0|org-whitespace"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "whitespace@example.com",
        },
      }
      const body = {
        payload: {
          name: "   ", // Only whitespace (trimmed would be empty)
        },
      }

      // Act & Assert - ValidationPipe will throw BadRequestException
      // Note: MinLength validator doesn't trim, so this might pass validation
      // but fail in the service layer. For now, we test that it throws.
      await expect(controller.createOrganization(mockRequest, body)).rejects.toThrow()
    })
  })
})
