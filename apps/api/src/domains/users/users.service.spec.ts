import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import type { Auth0UserInfoResponse } from "@/domains/auth/auth0-userinfo.service"
import { User } from "./user.entity"
import { userFactory } from "./user.factory"
import { UsersService } from "./users.service"

describe("UsersService", () => {
  let service: UsersService
  let repository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      providers: [UsersService],
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
    // Get service and repository from transactional module
    service = setup.module.get<UsersService>(UsersService)
    repository = setup.getRepository(User)
  })

  afterEach(async () => {
    // Rollback transaction - automatically cleans up all data
    await setup.rollbackTransaction()
  })

  describe("findByAuth0Id", () => {
    it("should return null when user does not exist", async () => {
      const result = await service.findByAuth0Id("auth0|nonexistent")
      expect(result).toBeNull()
    })

    it("should return user when it exists", async () => {
      const user = userFactory.build({
        auth0Id: "auth0|user-123",
        email: "test@example.com",
      })
      await repository.save(user)

      const result = await service.findByAuth0Id("auth0|user-123")
      expect(result).not.toBeNull()
      expect(result?.id).toBe(user.id)
      expect(result?.auth0Id).toBe("auth0|user-123")
      expect(result?.email).toBe("test@example.com")
    })
  })

  describe("findById", () => {
    it("should return null when user does not exist", async () => {
      const result = await service.findById("00000000-0000-0000-0000-000000000000")
      expect(result).toBeNull()
    })

    it("should return user when it exists", async () => {
      const user = userFactory.build({
        auth0Id: "auth0|user-findbyid-test",
        email: "test@example.com",
      })
      const savedUser = await repository.save(user)

      const result = await service.findById(savedUser.id)
      expect(result).not.toBeNull()
      expect(result?.id).toBe(savedUser.id)
      expect(result?.email).toBe("test@example.com")
    })
  })

  describe("create", () => {
    it("should create a new user", async () => {
      const auth0UserInfo = {
        sub: "auth0|user-new-user",
        email: "newuser@example.com",
        name: "New User",
        picture: "https://example.com/picture.jpg",
      }

      const user = await service.create(auth0UserInfo)

      expect(user.id).toBeDefined()
      expect(user.auth0Id).toBe("auth0|user-new-user")
      expect(user.email).toBe("newuser@example.com")
      expect(user.name).toBe("New User")
      expect(user.pictureUrl).toBe("https://example.com/picture.jpg")
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it("should throw error when email is not provided", async () => {
      const auth0UserInfo = {
        sub: "auth0|no-email",
      }

      await expect(service.create(auth0UserInfo)).rejects.toThrow(
        "Email is required from Auth0 token",
      )
    })

    it("should create user with null values for optional fields", async () => {
      const auth0UserInfo = {
        sub: "auth0|minimal",
        email: "minimal@example.com",
      }

      const user = await service.create(auth0UserInfo)

      expect(user.name).toBeNull()
      expect(user.pictureUrl).toBeNull()
    })

    it("should persist user to database", async () => {
      const auth0UserInfo = {
        sub: "auth0|persisted",
        email: "persisted@example.com",
      }

      const user = await service.create(auth0UserInfo)

      // Use service to find the user (both use the same transactional repository)
      const foundUser = await service.findById(user.id)
      expect(foundUser).not.toBeNull()
      expect(foundUser?.auth0Id).toBe("auth0|persisted")
    })
  })

  describe("findOrCreate", () => {
    it("should create user when it does not exist", async () => {
      const auth0UserInfo = {
        sub: "auth0|create-new",
        email: "create@example.com",
        name: "Create User",
      }

      const user = await service.findOrCreate({
        sub: auth0UserInfo.sub,
        getUserInfo: () =>
          Promise.resolve({
            sub: auth0UserInfo.sub,
            email: auth0UserInfo.email,
            name: auth0UserInfo.name,
          } as Auth0UserInfoResponse),
      })

      expect(user.auth0Id).toBe("auth0|create-new")
      expect(user.email).toBe("create@example.com")
      expect(user.name).toBe("Create User")

      // Verify it was saved - use service to query (both use same transaction)
      const found = await service.findByAuth0Id("auth0|create-new")
      expect(found).not.toBeNull()
      expect(found?.id).toBe(user.id)
    })

    it("should return existing user when it exists", async () => {
      const existingUser = userFactory.build({
        auth0Id: "auth0|user-existing",
        email: "existing@example.com",
        name: "Existing User",
      })
      await repository.save(existingUser)

      const auth0UserInfo = {
        sub: "auth0|user-existing",
        email: "existing@example.com",
        name: "Existing User",
      }

      const user = await service.findOrCreate({
        sub: auth0UserInfo.sub,
        getUserInfo: () => Promise.resolve({} as Auth0UserInfoResponse),
      })

      expect(user.id).toBe(existingUser.id)
      expect(user.email).toBe("existing@example.com")

      // Verify no duplicate was created
      const count = await repository.count({ where: { auth0Id: "auth0|user-existing" } })
      expect(count).toBe(1)
    })
  })
})
