import {
  parseCliOptions,
  parseInvitationCsv,
  runInvitationBatch,
} from "./invite-organization-owners"

describe("invite-organization-owners CLI helpers", () => {
  describe("parseCliOptions", () => {
    it("should parse file and dry-run flags", () => {
      const options = parseCliOptions(["--file", "owners.csv", "--dry-run"])
      expect(options).toEqual({
        csvFilePath: "owners.csv",
        dryRun: true,
        inviterName: "CaseAI Connect",
      })
    })

    it("should parse inviter-name flag", () => {
      const options = parseCliOptions(["--file", "owners.csv", "--inviter-name", "Admin"])
      expect(options).toEqual({
        csvFilePath: "owners.csv",
        dryRun: false,
        inviterName: "Admin",
      })
    })

    it("should throw when file is missing", () => {
      expect(() => parseCliOptions(["--dry-run"])).toThrow(
        "Missing required argument: --file <path-to-csv>",
      )
    })
  })

  describe("parseInvitationCsv", () => {
    it("should parse rows with required headers", () => {
      const csv = "email,organizationName,fullName\nuser@example.com,Demo Org,Demo User"
      const rows = parseInvitationCsv(csv)

      expect(rows).toEqual([
        {
          email: "user@example.com",
          organizationName: "Demo Org",
          fullName: "Demo User",
        },
      ])
    })

    it("should parse rows without fullName", () => {
      const csv = "email,organizationName\nuser@example.com,Demo Org"
      const rows = parseInvitationCsv(csv)

      expect(rows).toEqual([
        {
          email: "user@example.com",
          organizationName: "Demo Org",
        },
      ])
    })

    it("should handle quoted values with commas", () => {
      const csv = 'email,organizationName\nuser@example.com,"Org, Inc."'
      const rows = parseInvitationCsv(csv)

      expect(rows).toEqual([
        {
          email: "user@example.com",
          organizationName: "Org, Inc.",
        },
      ])
    })
  })

  describe("runInvitationBatch", () => {
    it("should call inviteWorkspaceOwner in normal mode", async () => {
      const invitationService = {
        previewInvitation: jest.fn(),
        inviteWorkspaceOwner: jest.fn().mockResolvedValue({
          status: "invited",
          email: "user@example.com",
          organizationName: "Demo Org",
          organizationId: "org-1",
          projectId: "proj-1",
          userId: "user-1",
          message: "Invitation sent.",
        }),
      }

      const results = await runInvitationBatch({
        rows: [{ email: "user@example.com", organizationName: "Demo Org" }],
        dryRun: false,
        inviterName: "Admin",
        invitationService: invitationService as never,
      })

      expect(invitationService.inviteWorkspaceOwner).toHaveBeenCalledTimes(1)
      expect(invitationService.inviteWorkspaceOwner).toHaveBeenCalledWith({
        email: "user@example.com",
        organizationName: "Demo Org",
        inviterName: "Admin",
        fullName: undefined,
      })
      expect(results[0]?.status).toBe("invited")
    })

    it("should call previewInvitation in dry-run mode", async () => {
      const invitationService = {
        previewInvitation: jest.fn().mockResolvedValue({
          status: "would_invite",
          email: "user@example.com",
          organizationName: "Demo Org",
        }),
        inviteWorkspaceOwner: jest.fn(),
      }

      const results = await runInvitationBatch({
        rows: [{ email: "user@example.com", organizationName: "Demo Org" }],
        dryRun: true,
        inviterName: "Admin",
        invitationService: invitationService as never,
      })

      expect(invitationService.previewInvitation).toHaveBeenCalledTimes(1)
      expect(invitationService.inviteWorkspaceOwner).not.toHaveBeenCalled()
      expect(results[0]?.status).toBe("would_invite")
    })

    it("should catch errors and report them as failed", async () => {
      const invitationService = {
        previewInvitation: jest.fn(),
        inviteWorkspaceOwner: jest.fn().mockRejectedValue(new Error("Auth0 failure")),
      }

      const results = await runInvitationBatch({
        rows: [{ email: "user@example.com", organizationName: "Demo Org" }],
        dryRun: false,
        inviterName: "Admin",
        invitationService: invitationService as never,
      })

      expect(results[0]?.status).toBe("failed")
      expect(results[0]).toHaveProperty("message", "Auth0 failure")
    })
  })
})
