import {
  parseCliOptions,
  parseProvisioningCsv,
  runProvisioningBatch,
} from "./provision-first-users"

describe("provision-first-users CLI helpers", () => {
  describe("parseCliOptions", () => {
    it("should parse file and dry-run flags", () => {
      const options = parseCliOptions(["--file", "users.csv", "--dry-run"])
      expect(options).toEqual({
        csvFilePath: "users.csv",
        dryRun: true,
      })
    })

    it("should throw when file is missing", () => {
      expect(() => parseCliOptions(["--dry-run"])).toThrow(
        "Missing required argument: --file <path-to-csv>",
      )
    })
  })

  describe("parseProvisioningCsv", () => {
    it("should parse rows with required headers", () => {
      const csv = "email,organizationName,fullName\nuser@example.com,Demo Org,Demo User"
      const rows = parseProvisioningCsv(csv)

      expect(rows).toEqual([
        {
          email: "user@example.com",
          organizationName: "Demo Org",
          fullName: "Demo User",
        },
      ])
    })
  })

  describe("runProvisioningBatch", () => {
    it("should call provisionFirstUser in normal mode", async () => {
      const provisioningService = {
        previewProvisioning: jest.fn(),
        provisionFirstUser: jest.fn().mockResolvedValue({
          status: "created",
          email: "user@example.com",
          organizationName: "Demo Org",
          message: "done",
        }),
      }

      const results = await runProvisioningBatch({
        rows: [{ email: "user@example.com", organizationName: "Demo Org" }],
        dryRun: false,
        provisioningService: provisioningService as never,
      })

      expect(provisioningService.provisionFirstUser).toHaveBeenCalledTimes(1)
      expect(results[0]?.status).toBe("created")
    })

    it("should call previewProvisioning in dry-run mode", async () => {
      const provisioningService = {
        previewProvisioning: jest.fn().mockResolvedValue({
          status: "would_create",
          email: "user@example.com",
          organizationName: "Demo Org",
        }),
        provisionFirstUser: jest.fn(),
      }

      const results = await runProvisioningBatch({
        rows: [{ email: "user@example.com", organizationName: "Demo Org" }],
        dryRun: true,
        provisioningService: provisioningService as never,
      })

      expect(provisioningService.previewProvisioning).toHaveBeenCalledTimes(1)
      expect(provisioningService.provisionFirstUser).not.toHaveBeenCalled()
      expect(results[0]?.status).toBe("would_create")
    })
  })
})
