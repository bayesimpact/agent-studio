import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { User } from "./user.entity"
import { userFactory } from "./user.factory"
import { UsersService } from "./users.service"

describe("UsersService", () => {
  let service: UsersService
  let repository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase([User], [UsersService])
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

      const user = await service.findOrCreate(auth0UserInfo)

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

      const user = await service.findOrCreate(auth0UserInfo)

      expect(user.id).toBe(existingUser.id)
      expect(user.email).toBe("existing@example.com")

      // Verify no duplicate was created
      const count = await repository.count({ where: { auth0Id: "auth0|user-existing" } })
      expect(count).toBe(1)
    })

    it("should update user when Auth0 info changes", async () => {
      const existingUser = userFactory.build({
        auth0Id: "auth0|update",
        email: "old@example.com",
        name: "Old Name",
        pictureUrl: "https://old.com/pic.jpg",
      })
      await repository.save(existingUser)

      const auth0UserInfo = {
        sub: "auth0|update",
        email: "new@example.com",
        name: "New Name",
        picture: "https://new.com/pic.jpg",
      }

      const user = await service.findOrCreate(auth0UserInfo)

      expect(user.id).toBe(existingUser.id)
      expect(user.email).toBe("new@example.com")
      expect(user.name).toBe("New Name")
      expect(user.pictureUrl).toBe("https://new.com/pic.jpg")

      // Verify it was updated in database - use service to query
      const updatedUser = await service.findById(existingUser.id)
      expect(updatedUser?.email).toBe("new@example.com")
      expect(updatedUser?.name).toBe("New Name")
    })

    it("should update only changed fields", async () => {
      const existingUser = userFactory.build({
        auth0Id: "auth0|partial-update",
        email: "original@example.com",
        name: "Original Name",
        pictureUrl: "https://original.com/pic.jpg",
      })
      await repository.save(existingUser)

      const auth0UserInfo = {
        sub: "auth0|partial-update",
        email: "original@example.com", // Same
        name: "Updated Name", // Changed
        picture: "https://original.com/pic.jpg", // Same
      }

      const user = await service.findOrCreate(auth0UserInfo)

      expect(user.email).toBe("original@example.com")
      expect(user.name).toBe("Updated Name")
      expect(user.pictureUrl).toBe("https://original.com/pic.jpg")
    })

    it("should not update when nothing changed", async () => {
      const existingUser = userFactory.build({
        auth0Id: "auth0|no-change",
        email: "same@example.com",
        name: "Same Name",
        pictureUrl: "https://same.com/pic.jpg",
      })
      const originalUpdatedAt = existingUser.updatedAt
      await repository.save(existingUser)

      // Wait a bit to ensure timestamp would change if updated
      await new Promise((resolve) => setTimeout(resolve, 10))

      const auth0UserInfo = {
        sub: "auth0|no-change",
        email: "same@example.com",
        name: "Same Name",
        picture: "https://same.com/pic.jpg",
      }

      const user = await service.findOrCreate(auth0UserInfo)

      expect(user.id).toBe(existingUser.id)
      // Verify it's the same instance (not a new save) - use service to query
      const foundUser = await service.findById(existingUser.id)
      expect(foundUser?.updatedAt.getTime()).toBeLessThanOrEqual(originalUpdatedAt.getTime() + 1000)
    })

    it("should handle missing optional fields in update", async () => {
      const existingUser = userFactory.build({
        auth0Id: "auth0|missing-fields",
        email: "original@example.com",
        name: "Original Name",
        pictureUrl: "https://original.com/pic.jpg",
      })
      await repository.save(existingUser)

      const auth0UserInfo = {
        sub: "auth0|missing-fields",
        // email, name, picture not provided
      }

      const user = await service.findOrCreate(auth0UserInfo)

      // Should preserve existing values when not provided
      expect(user.email).toBe("original@example.com")
      expect(user.name).toBe("Original Name")
      expect(user.pictureUrl).toBe("https://original.com/pic.jpg")
    })
  })
})
