import { InternalServerErrorException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { Auth0UserProvisioningService } from "./auth0-user-provisioning.service"

global.fetch = jest.fn()

const configValues: Record<string, string> = {
  AUTH0_ISSUER_URL: "https://test-tenant.auth0.com/",
  AUTH0_ORGANIZATION_ID: "org_test",
  AUTH0_CLIENT_ID: "client_test",
  AUTH0_M2M_CLIENT_ID: "m2m_client_test",
  AUTH0_M2M_CLIENT_SECRET: "m2m_secret_test",
  AUTH0_DB_CONNECTION_NAME: "Username-Password-Authentication",
}

describe("Auth0UserProvisioningService", () => {
  let service: Auth0UserProvisioningService
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        Auth0UserProvisioningService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const value = configValues[key]
              if (!value) {
                throw new Error(`Configuration key "${key}" does not exist`)
              }
              return value
            }),
          },
        },
      ],
    }).compile()

    service = module.get<Auth0UserProvisioningService>(Auth0UserProvisioningService)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockTokenResponse = () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-token", expires_in: 3600 }),
    })
  }

  describe("findOrCreateUserByEmail", () => {
    it("should return existing user when found by email", async () => {
      mockTokenResponse()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ email: "existing@example.com", user_id: "auth0|existing" }],
      })

      const result = await service.findOrCreateUserByEmail({
        email: "existing@example.com",
      })

      expect(result).toEqual({
        email: "existing@example.com",
        userId: "auth0|existing",
      })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("should create user when no user exists", async () => {
      mockTokenResponse()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: "new@example.com", user_id: "auth0|new" }),
      })

      const result = await service.findOrCreateUserByEmail({
        email: "new@example.com",
        fullName: "New User",
      })

      expect(result).toEqual({
        email: "new@example.com",
        userId: "auth0|new",
      })

      expect(global.fetch).toHaveBeenCalledWith("https://test-tenant.auth0.com/api/v2/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: expect.stringContaining('"connection":"Username-Password-Authentication"'),
      })
    })
  })

  describe("ensureUserInDefaultOrganization", () => {
    it("should add member to default organization", async () => {
      mockTokenResponse()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await service.ensureUserInDefaultOrganization("auth0|user123")

      expect(global.fetch).toHaveBeenCalledWith(
        "https://test-tenant.auth0.com/api/v2/organizations/org_test/members",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            members: ["auth0|user123"],
          }),
        },
      )
    })

    it("should ignore conflict response for existing membership", async () => {
      mockTokenResponse()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
      })

      await expect(
        service.ensureUserInDefaultOrganization("auth0|user123"),
      ).resolves.toBeUndefined()
    })
  })

  describe("sendPasswordResetEmail", () => {
    it("should call change_password endpoint", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      await service.sendPasswordResetEmail("reset@example.com")

      expect(global.fetch).toHaveBeenCalledWith(
        "https://test-tenant.auth0.com/dbconnections/change_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: "client_test",
            email: "reset@example.com",
            connection: "Username-Password-Authentication",
          }),
        },
      )
    })

    it("should throw when reset call fails", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "bad request",
      })

      await expect(service.sendPasswordResetEmail("reset@example.com")).rejects.toThrow(
        new InternalServerErrorException("Failed to trigger password reset email: 400 bad request"),
      )
    })
  })
})
