import { buildEndpointRequestWithOrganizationAndProject } from "@/common/test/request.factory"
import type { MulterFile } from "@/common/types"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { documentsControllerTestSetup } from "./test-setup"

const getTestContext = documentsControllerTestSetup()

function createMockFile(overrides: Partial<MulterFile> = {}): MulterFile {
  return {
    fieldname: "file",
    originalname: "test-document.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    size: 1024,
    buffer: Buffer.from("test file content"),
    destination: "",
    filename: "",
    path: "",
    stream: {} as never,
    ...overrides,
  }
}

describe("Documents - uploadOne", () => {
  describe("user is owner", () => {
    it("successfully uploads a text file", async () => {
      const { controller } = getTestContext()
      const { organization, user, project } = await createOrganizationWithProject(getTestContext())

      const mockRequest = buildEndpointRequestWithOrganizationAndProject(
        organization,
        user,
        project,
      )

      const file = createMockFile({
        originalname: "readme.txt",
        mimetype: "text/plain",
      })

      const { data: result } = await controller.uploadOne(file, mockRequest)

      expect(result.fileName).toBe("readme.txt")
      expect(result.mimeType).toBe("text/plain")
    })
  })
})
