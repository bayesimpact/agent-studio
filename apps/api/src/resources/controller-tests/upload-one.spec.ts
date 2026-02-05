import { buildEndpointRequestWithOrganizationAndProject } from "@/common/test/request.factory"
import type { MulterFile } from "@/common/types"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { resourcesControllerTestSetup } from "./test-setup"

const getTestContext = resourcesControllerTestSetup()

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

describe("Resources - uploadOne", () => {
  describe("user is owner", () => {
    // it("successfully uploads a PDF file", async () => {
    //   const { controller, resourceRepository } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-document.pdf",
    //     mimetype: "application/pdf",
    //   })

    //   const existingResources = await resourceRepository.find({
    //     where: { projectId: project.id },
    //   })
    //   expect(existingResources).toHaveLength(0)

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-document.pdf")
    //   expect(result.mimeType).toBe("application/pdf")
    //   expect(result.projectId).toBe(project.id)
    //   expect(result.title).toBe("test-document.pdf")

    //   const savedResources = await resourceRepository.find({
    //     where: { projectId: project.id },
    //   })
    //   expect(savedResources).toHaveLength(1)
    // })

    // it("successfully uploads an image file (PNG)", async () => {
    //   const { controller } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-image.png",
    //     mimetype: "image/png",
    //   })

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-image.png")
    //   expect(result.mimeType).toBe("image/png")
    //   expect(result.projectId).toBe(project.id)
    // })

    // it("successfully uploads an image file (JPEG)", async () => {
    //   const { controller } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-image.jpeg",
    //     mimetype: "image/jpeg",
    //   })

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-image.jpeg")
    //   expect(result.mimeType).toBe("image/jpeg")
    // })

    // it("successfully uploads a Word document (DOCX)", async () => {
    //   const { controller } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-document.docx",
    //     mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    //   })

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-document.docx")
    //   expect(result.mimeType).toBe(
    //     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    //   )
    // })

    // it("successfully uploads an Excel spreadsheet (XLSX)", async () => {
    //   const { controller } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-spreadsheet.xlsx",
    //     mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //   })

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-spreadsheet.xlsx")
    //   expect(result.mimeType).toBe(
    //     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //   )
    // })

    // it("successfully uploads a PowerPoint presentation (PPTX)", async () => {
    //   const { controller } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-presentation.pptx",
    //     mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    //   })

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-presentation.pptx")
    //   expect(result.mimeType).toBe(
    //     "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    //   )
    // })

    // it("successfully uploads a CSV file", async () => {
    //   const { controller } = getTestContext()
    //   const { organization, user, project } = await createOrganizationWithProject(getTestContext())

    //   const mockRequest = buildEndpointRequestWithOrganizationAndProject(
    //     organization,
    //     user,
    //     project,
    //   )

    //   const file = createMockFile({
    //     originalname: "test-data.csv",
    //     mimetype: "text/csv",
    //   })

    //   const { data: result } = await controller.uploadOne(file, mockRequest)

    //   expect(result.fileName).toBe("test-data.csv")
    //   expect(result.mimeType).toBe("text/csv")
    // })

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

  // describe("user is admin", () => {
  //   it("successfully uploads a file", async () => {
  //     const { controller, resourceRepository } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(
  //       getTestContext(),
  //       {
  //         membership: { role: "admin" },
  //       },
  //     )

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "admin-document.pdf",
  //       mimetype: "application/pdf",
  //     })

  //     const existingResources = await resourceRepository.find({
  //       where: { projectId: project.id },
  //     })
  //     expect(existingResources).toHaveLength(0)

  //     const { data: result } = await controller.uploadOne(file, mockRequest)

  //     expect(result.fileName).toBe("admin-document.pdf")
  //     expect(result.mimeType).toBe("application/pdf")
  //     expect(result.projectId).toBe(project.id)
  //   })
  // })

  // describe("user is member", () => {
  //   it("successfully uploads a file", async () => {
  //     const { controller, resourceRepository } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(
  //       getTestContext(),
  //       {
  //         membership: { role: "member" },
  //       },
  //     )

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "member-document.pdf",
  //       mimetype: "application/pdf",
  //     })

  //     const existingResources = await resourceRepository.find({
  //       where: { projectId: project.id },
  //     })
  //     expect(existingResources).toHaveLength(0)

  //     const { data: result } = await controller.uploadOne(file, mockRequest)

  //     expect(result.fileName).toBe("member-document.pdf")
  //     expect(result.mimeType).toBe("application/pdf")
  //     expect(result.projectId).toBe(project.id)
  //   })
  // })

  // describe("validation errors", () => {
  //   it("throws UnprocessableEntityException when project ID is missing", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )
  //     // Remove project ID to simulate missing project
  //     mockRequest.project = undefined as never

  //     const file = createMockFile()

  //     await expect(controller.uploadOne(file, mockRequest)).rejects.toThrow(
  //       "Project ID is required",
  //     )
  //   })

  //   it("throws UnprocessableEntityException for invalid MIME type", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "script.js",
  //       mimetype: "application/javascript",
  //     })

  //     await expect(controller.uploadOne(file, mockRequest)).rejects.toThrow(
  //       "Invalid file type: application/javascript",
  //     )
  //   })

  //   it("throws UnprocessableEntityException when file extension is missing", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "noextension",
  //       mimetype: "application/pdf",
  //     })

  //     await expect(controller.uploadOne(file, mockRequest)).rejects.toThrow(
  //       "File extension is required",
  //     )
  //   })

  //   it("throws UnprocessableEntityException when MIME type is missing", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       mimetype: "",
  //     })

  //     await expect(controller.uploadOne(file, mockRequest)).rejects.toThrow(
  //       "File MIME type is required",
  //     )
  //   })
  // })

  // describe("legacy Microsoft document formats", () => {
  //   it("successfully uploads a legacy Word document (DOC)", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "old-document.doc",
  //       mimetype: "application/msword",
  //     })

  //     const { data: result } = await controller.uploadOne(file, mockRequest)

  //     expect(result.fileName).toBe("old-document.doc")
  //     expect(result.mimeType).toBe("application/msword")
  //   })

  //   it("successfully uploads a legacy Excel spreadsheet (XLS)", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "old-spreadsheet.xls",
  //       mimetype: "application/vnd.ms-excel",
  //     })

  //     const { data: result } = await controller.uploadOne(file, mockRequest)

  //     expect(result.fileName).toBe("old-spreadsheet.xls")
  //     expect(result.mimeType).toBe("application/vnd.ms-excel")
  //   })

  //   it("successfully uploads a legacy PowerPoint presentation (PPT)", async () => {
  //     const { controller } = getTestContext()
  //     const { organization, user, project } = await createOrganizationWithProject(getTestContext())

  //     const mockRequest = buildEndpointRequestWithOrganizationAndProject(
  //       organization,
  //       user,
  //       project,
  //     )

  //     const file = createMockFile({
  //       originalname: "old-presentation.ppt",
  //       mimetype: "application/vnd.ms-powerpoint",
  //     })

  //     const { data: result } = await controller.uploadOne(file, mockRequest)

  //     expect(result.fileName).toBe("old-presentation.ppt")
  //     expect(result.mimeType).toBe("application/vnd.ms-powerpoint")
  //   })
  // })
})
