import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm"
import { DataSource, type Repository } from "typeorm"
import { Organization } from "../organizations/organization.entity"
import { UserMembership } from "../organizations/user-membership.entity"
import { User } from "./user.entity"
import { userFactory } from "./user.factory"
import { UsersService } from "./users.service"

describe("UsersService", () => {
  let service: UsersService
  let repository: Repository<User>
  let dataSource: DataSource
  let module: TestingModule

  beforeAll(async () => {
    // Use DATABASE_URL from .env.test
    const testDatabaseUrl = process.env.DATABASE_URL
    if (!testDatabaseUrl) {
      throw new Error("DATABASE_URL not found in environment. Make sure .env.test is loaded.")
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: "postgres",
          url: testDatabaseUrl,
          entities: [User, Organization, UserMembership],
          synchronize: true, // Use synchronize for tests
          logging: false,
          dropSchema: false, // Don't drop schema, just clear data
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repository = module.get<Repository<User>>(getRepositoryToken(User))
    dataSource = module.get<DataSource>(DataSource)
  })

  afterAll(async () => {
    // Clear tables in correct order (child tables first due to foreign keys)
    await dataSource.getRepository(UserMembership).createQueryBuilder().delete().execute()
    await dataSource.getRepository(Organization).createQueryBuilder().delete().execute()
    await repository.createQueryBuilder().delete().execute()
    await dataSource.destroy()
    await module.close()
  })

  beforeEach(async () => {
    // Clear all data before each test (child tables first due to foreign keys)
    await dataSource.getRepository(UserMembership).createQueryBuilder().delete().execute()
    await dataSource.getRepository(Organization).createQueryBuilder().delete().execute()
    await repository.createQueryBuilder().delete().execute()
  })

  describe("findByAuth0Id", () => {
    it("should return null when user does not exist", async () => {
      const result = await service.findByAuth0Id("auth0|nonexistent")
      expect(result).toBeNull()
    })

    it("should return user when it exists", async () => {
      const user = userFactory.build({
        auth0Id: "auth0|123",
        email: "test@example.com",
      })
      await repository.save(user)

      const result = await service.findByAuth0Id("auth0|123")
      expect(result).not.toBeNull()
      expect(result?.id).toBe(user.id)
      expect(result?.auth0Id).toBe("auth0|123")
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
        sub: "auth0|new-user",
        email: "newuser@example.com",
        name: "New User",
        picture: "https://example.com/picture.jpg",
      }

      const user = await service.create(auth0UserInfo)

      expect(user.id).toBeDefined()
      expect(user.auth0Id).toBe("auth0|new-user")
      expect(user.email).toBe("newuser@example.com")
      expect(user.name).toBe("New User")
      expect(user.pictureUrl).toBe("https://example.com/picture.jpg")
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it("should create user with empty email when email is not provided", async () => {
      const auth0UserInfo = {
        sub: "auth0|no-email",
      }

      const user = await service.create(auth0UserInfo)

      expect(user.email).toBe("")
      expect(user.name).toBeNull()
      expect(user.pictureUrl).toBeNull()
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

      const foundUser = await repository.findOne({ where: { id: user.id } })
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

      // Verify it was saved
      const count = await repository.count({ where: { auth0Id: "auth0|create-new" } })
      expect(count).toBe(1)
    })

    it("should return existing user when it exists", async () => {
      const existingUser = userFactory.build({
        auth0Id: "auth0|existing",
        email: "existing@example.com",
        name: "Existing User",
      })
      await repository.save(existingUser)

      const auth0UserInfo = {
        sub: "auth0|existing",
        email: "existing@example.com",
        name: "Existing User",
      }

      const user = await service.findOrCreate(auth0UserInfo)

      expect(user.id).toBe(existingUser.id)
      expect(user.email).toBe("existing@example.com")

      // Verify no duplicate was created
      const count = await repository.count({ where: { auth0Id: "auth0|existing" } })
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

      // Verify it was updated in database
      const updatedUser = await repository.findOne({ where: { id: existingUser.id } })
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
      // Verify it's the same instance (not a new save)
      const foundUser = await repository.findOne({ where: { id: existingUser.id } })
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
