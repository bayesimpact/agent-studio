import { InternalServerErrorException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { Auth0InvitationSenderService } from "./auth0-invitation-sender.service"

// Mock fetch globally
global.fetch = jest.fn()

const AUTH0_ISSUER_URL = "https://bayes-impact.eu.auth0.com/"
const AUTH0_ORGANIZATION_ID = "org_test123"
const AUTH0_CLIENT_ID = "spa_client_id"
const AUTH0_M2M_CLIENT_ID = "m2m_client_id"
const AUTH0_M2M_CLIENT_SECRET = "m2m_client_secret"

const configValues: Record<string, string> = {
  AUTH0_ISSUER_URL,
  AUTH0_ORGANIZATION_ID,
  AUTH0_CLIENT_ID,
  AUTH0_M2M_CLIENT_ID,
  AUTH0_M2M_CLIENT_SECRET,
}

describe("Auth0InvitationSenderService", () => {
  let service: Auth0InvitationSenderService
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        Auth0InvitationSenderService,
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

    service = module.get<Auth0InvitationSenderService>(Auth0InvitationSenderService)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockTokenResponse = (token = "test-management-token", expiresIn = 86400) => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: token, expires_in: expiresIn }),
    })
  }

  const mockInvitationResponse = () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "inv_123" }),
    })
  }

  const sendInvitationParams = {
    inviteeEmail: "user@example.com",
    inviterName: "Admin User",
    metadata: { invitationToken: "token-uuid-123" },
  }

  describe("sendInvitation", () => {
    it("should obtain a token and send an invitation", async () => {
      mockTokenResponse()
      mockInvitationResponse()

      await service.sendInvitation(sendInvitationParams)

      // Verify token request
      expect(global.fetch).toHaveBeenCalledWith("https://bayes-impact.eu.auth0.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: AUTH0_M2M_CLIENT_ID,
          client_secret: AUTH0_M2M_CLIENT_SECRET,
          audience: "https://bayes-impact.eu.auth0.com/api/v2/",
          grant_type: "client_credentials",
        }),
      })

      // Verify invitation request
      expect(global.fetch).toHaveBeenCalledWith(
        `https://bayes-impact.eu.auth0.com/api/v2/organizations/${AUTH0_ORGANIZATION_ID}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-management-token",
          },
          body: JSON.stringify({
            inviter: { name: "Admin User" },
            invitee: { email: "user@example.com" },
            client_id: AUTH0_CLIENT_ID,
            send_invitation_email: true,
            user_metadata: { invitationToken: "token-uuid-123" },
          }),
        },
      )
    })

    it("should not include user_metadata when metadata is undefined", async () => {
      mockTokenResponse()
      mockInvitationResponse()

      await service.sendInvitation({
        inviteeEmail: "user@example.com",
        inviterName: "Admin User",
      })

      const invitationCall = (global.fetch as jest.Mock).mock.calls[1]!
      const body = JSON.parse(invitationCall[1].body)
      expect(body).not.toHaveProperty("user_metadata")
    })

    it("should cache the management token and reuse it on subsequent calls", async () => {
      mockTokenResponse()
      mockInvitationResponse()
      // Second invitation call — no new token request needed
      mockInvitationResponse()

      await service.sendInvitation(sendInvitationParams)
      await service.sendInvitation(sendInvitationParams)

      // Token endpoint should be called only once
      const tokenCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: string[]) => call[0] === "https://bayes-impact.eu.auth0.com/oauth/token",
      )
      expect(tokenCalls).toHaveLength(1)

      // Invitation endpoint should be called twice
      const invitationCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: string[]) =>
          call[0] ===
          `https://bayes-impact.eu.auth0.com/api/v2/organizations/${AUTH0_ORGANIZATION_ID}/invitations`,
      )
      expect(invitationCalls).toHaveLength(2)
    })

    it("should refresh the token when it is expired", async () => {
      // First call with a token that expires immediately (0 seconds)
      mockTokenResponse("first-token", 0)
      mockInvitationResponse()

      await service.sendInvitation(sendInvitationParams)

      // Second call — token is expired, should fetch a new one
      mockTokenResponse("second-token")
      mockInvitationResponse()

      await service.sendInvitation(sendInvitationParams)

      // Token endpoint should be called twice
      const tokenCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: string[]) => call[0] === "https://bayes-impact.eu.auth0.com/oauth/token",
      )
      expect(tokenCalls).toHaveLength(2)
    })

    it("should throw InternalServerErrorException when token request fails", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      })

      await expect(service.sendInvitation(sendInvitationParams)).rejects.toThrow(
        new InternalServerErrorException("Failed to obtain Auth0 Management API token"),
      )
    })

    it("should throw InternalServerErrorException when invitation request fails", async () => {
      mockTokenResponse()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{"message":"Bad Request"}',
      })

      await expect(service.sendInvitation(sendInvitationParams)).rejects.toThrow(
        InternalServerErrorException,
      )
    })

    it("should include Auth0 error details in the exception message", async () => {
      mockTokenResponse()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => '{"message":"Member already exists"}',
      })

      await expect(service.sendInvitation(sendInvitationParams)).rejects.toThrow(
        'Failed to send Auth0 invitation: 409 {"message":"Member already exists"}',
      )
    })

    it("should handle network errors", async () => {
      const networkError = new Error("Network request failed")
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(networkError)

      await expect(service.sendInvitation(sendInvitationParams)).rejects.toThrow(networkError)
    })
  })
})
