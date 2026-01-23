import type { Repository } from "typeorm"
import { Auth0UserInfoService } from "@/auth/auth0-userinfo.service"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { organizationFactory } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { User } from "@/users/user.entity"
import { MeController } from "./me.controller"
import { MeModule } from "./me.module"

describe("MeController", () => {
  let controller: MeController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let auth0UserInfoService: Auth0UserInfoService

  beforeAll(async () => {
    // Use transactional setup with MeModule import
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership],
      [],
      [MeModule],
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
    controller = setup.module.get<MeController>(MeController)
    auth0UserInfoService = setup.module.get<Auth0UserInfoService>(Auth0UserInfoService)
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    // Clear mocks before each test
    jest.clearAllMocks()
  })

  afterEach(async () => {
    // Rollback transaction - automatically cleans up all data
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("getMe", () => {
    it("should return user and organizations", async () => {
      // Arrange
      const auth0Sub = "auth0|123456"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "test@example.com",
          name: "Test User",
          picture: "https://example.com/picture.jpg",
        },
      }

      // Create organizations and memberships in database
      const organization1 = organizationFactory.build({
        name: "Organization 1",
      })
      const savedOrg1 = await organizationRepository.save(organization1)

      const organization2 = organizationFactory.build({
        name: "Organization 2",
      })
      const savedOrg2 = await organizationRepository.save(organization2)

      // Act - This will create the user via UserBootstrapService
      const { data: result } = await controller.getMe(mockRequest)

      // Assert - User should be created
      expect(result.user.email).toBe("test@example.com")
      expect(result.user.name).toBe("Test User")
      expect(result.organizations).toEqual([]) // No memberships yet

      // Create memberships - ensure user exists in transaction
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user).not.toBeNull()

      if (user) {
        // Verify organizations exist in transaction
        const org1 = await organizationRepository.findOne({ where: { id: savedOrg1.id } })
        const org2 = await organizationRepository.findOne({ where: { id: savedOrg2.id } })
        expect(org1).not.toBeNull()
        expect(org2).not.toBeNull()

        const membership1 = membershipRepository.create({
          userId: user.id,
          organizationId: savedOrg1.id,
          role: "owner",
        })
        await membershipRepository.save(membership1)

        const membership2 = membershipRepository.create({
          userId: user.id,
          organizationId: savedOrg2.id,
          role: "member",
        })
        await membershipRepository.save(membership2)

        // Act again - Now with memberships
        const { data: resultWithOrgs } = await controller.getMe(mockRequest)

        // Assert
        expect(resultWithOrgs.organizations).toHaveLength(2)
        expect(resultWithOrgs.organizations).toEqual(
          expect.arrayContaining([
            { id: savedOrg1.id, name: "Organization 1", role: "owner" },
            { id: savedOrg2.id, name: "Organization 2", role: "member" },
          ]),
        )
      }
    })

    it("should handle user with no organizations", async () => {
      // Arrange
      const auth0Sub = "auth0|no-orgs"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "noorgs@example.com",
        },
      }

      // Act
      const { data: result } = await controller.getMe(mockRequest)

      // Assert
      expect(result.user.email).toBe("noorgs@example.com")
      expect(result.organizations).toEqual([])

      // Verify user was created in database
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user).not.toBeNull()
      expect(user?.email).toBe("noorgs@example.com")
    })

    it("should handle user with null name", async () => {
      // Arrange
      const auth0Sub = "auth0|null-name"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "nullname@example.com",
        },
      }

      // Act
      const { data: result } = await controller.getMe(mockRequest)

      // Assert
      expect(result.user.name).toBeNull()
      expect(result.user.email).toBe("nullname@example.com")

      // Verify in database
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user?.name).toBeNull()
    })

    it("should create user on first call and reuse on subsequent calls", async () => {
      // Arrange
      const auth0Sub = "auth0|idempotent"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "idempotent@example.com",
          name: "Idempotent User",
        },
      }

      // Act - First call
      const { data: result1 } = await controller.getMe(mockRequest)
      const userId1 = result1.user.id

      // Act - Second call
      const { data: result2 } = await controller.getMe(mockRequest)
      const userId2 = result2.user.id

      // Assert - Same user ID (idempotent)
      expect(userId1).toBe(userId2)
      expect(result1.user.email).toBe(result2.user.email)

      // Verify only one user exists in database
      const userCount = await userRepository.count({
        where: { auth0Id: auth0Sub },
      })
      expect(userCount).toBe(1)
    })

    it("should return organizations in correct format", async () => {
      // Arrange
      const auth0Sub = "auth0|org-format"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "orgformat@example.com",
        },
      }

      // Create organization and membership
      const organization = organizationFactory.build({
        name: "Test Org",
      })
      const savedOrg = await organizationRepository.save(organization)

      // Create user first
      await controller.getMe(mockRequest)
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })

      if (user) {
        const membership = membershipRepository.create({
          userId: user.id,
          organizationId: savedOrg.id,
          role: "admin",
        })
        await membershipRepository.save(membership)

        // Act
        const { data: result } = await controller.getMe(mockRequest)

        // Assert - Check format
        expect(result.organizations).toHaveLength(1)
        expect(result.organizations[0]).toEqual({
          id: savedOrg.id,
          name: "Test Org",
          role: "admin",
        })
        expect(result.organizations[0]).not.toHaveProperty("organization")
        expect(result.organizations[0]).not.toHaveProperty("createdAt")
      }
    })

    it("should fetch user info from Auth0 UserInfo endpoint when access token is provided", async () => {
      // Arrange
      const auth0Sub = "auth0|userinfo-test"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          // JWT payload doesn't have email/name
        },
      }
      const authorization = "Bearer test-access-token"
      const mockUserInfo = {
        sub: auth0Sub,
        email: "userinfo@example.com",
        name: "UserInfo User",
        picture: "https://example.com/userinfo.jpg",
      }

      // Mock getUserInfo method
      jest.spyOn(auth0UserInfoService, "getUserInfo").mockResolvedValueOnce(mockUserInfo)

      // Act
      const { data: result } = await controller.getMe(mockRequest, authorization)

      // Assert - Should use UserInfo data
      expect(result.user.email).toBe("userinfo@example.com")
      expect(result.user.name).toBe("UserInfo User")

      // Verify getUserInfo was called with the access token
      expect(auth0UserInfoService.getUserInfo).toHaveBeenCalledWith("test-access-token")

      // Verify user was created with UserInfo data
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user?.email).toBe("userinfo@example.com")
      expect(user?.name).toBe("UserInfo User")
      expect(user?.pictureUrl).toBe("https://example.com/userinfo.jpg")
    })

    it("should fall back to JWT payload when UserInfo endpoint fails", async () => {
      // Arrange
      const auth0Sub = "auth0|fallback-test"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "jwt@example.com",
          name: "JWT User",
        },
      }
      const authorization = "Bearer test-access-token"

      // Mock getUserInfo to throw an error
      jest
        .spyOn(auth0UserInfoService, "getUserInfo")
        .mockRejectedValueOnce(new Error("Failed to fetch user info from Auth0: 401"))

      // Act
      const { data: result } = await controller.getMe(mockRequest, authorization)

      // Assert - Should fall back to JWT payload
      expect(result.user.email).toBe("jwt@example.com")
      expect(result.user.name).toBe("JWT User")

      // Verify getUserInfo was called
      expect(auth0UserInfoService.getUserInfo).toHaveBeenCalledWith("test-access-token")

      // Verify user was created with JWT data
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user?.email).toBe("jwt@example.com")
      expect(user?.name).toBe("JWT User")
    })

    it("should merge UserInfo data with JWT payload (UserInfo takes precedence)", async () => {
      // Arrange
      const auth0Sub = "auth0|merge-test"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "jwt@example.com", // JWT has email
          name: "JWT Name", // JWT has name
        },
      }
      const authorization = "Bearer test-access-token"
      const mockUserInfo = {
        sub: auth0Sub,
        email: "userinfo@example.com", // UserInfo has different email
        // UserInfo doesn't have name, should use JWT name
      }

      // Mock getUserInfo method
      jest.spyOn(auth0UserInfoService, "getUserInfo").mockResolvedValueOnce(mockUserInfo)

      // Act
      const { data: result } = await controller.getMe(mockRequest, authorization)

      // Assert - UserInfo email should take precedence, JWT name should be used
      expect(result.user.email).toBe("userinfo@example.com") // From UserInfo
      expect(result.user.name).toBe("JWT Name") // From JWT (UserInfo doesn't have it)

      // Verify getUserInfo was called
      expect(auth0UserInfoService.getUserInfo).toHaveBeenCalledWith("test-access-token")

      // Verify in database
      const user = await userRepository.findOne({
        where: { auth0Id: auth0Sub },
      })
      expect(user?.email).toBe("userinfo@example.com")
      expect(user?.name).toBe("JWT Name")
    })

    it("should use JWT payload when no authorization header is provided", async () => {
      // Arrange
      const auth0Sub = "auth0|no-header"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "jwt-only@example.com",
          name: "JWT Only",
        },
      }

      // Set up spy to track calls
      const getUserInfoSpy = jest.spyOn(auth0UserInfoService, "getUserInfo")

      // Act
      const { data: result } = await controller.getMe(mockRequest, undefined)

      // Assert - Should use JWT payload only
      expect(result.user.email).toBe("jwt-only@example.com")
      expect(result.user.name).toBe("JWT Only")

      // Verify getUserInfo was not called
      expect(getUserInfoSpy).not.toHaveBeenCalled()
    })
  })
})
