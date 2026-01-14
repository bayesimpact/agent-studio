import { Test, type TestingModule } from "@nestjs/testing"
import { ProtectedController } from "./protected.controller"

describe("ProtectedController", () => {
  let controller: ProtectedController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtectedController],
    }).compile()

    controller = module.get<ProtectedController>(ProtectedController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("getHello", () => {
    it("should return protected route message with user sub", async () => {
      const mockRequest = {
        user: {
          sub: "test-user-123",
        },
      }

      const result = await controller.getHello(mockRequest)
      expect(result.data).toBe("Protected api route accessed by user: test-user-123")
    })
  })
})
