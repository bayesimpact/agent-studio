import { expect } from "@jest/globals"
import { Test, type TestingModule } from "@nestjs/testing"
import { GeolocService } from "./geoloc.service"

describe("GeolocService", () => {
  let service: GeolocService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeolocService],
    }).compile()

    service = module.get<GeolocService>(GeolocService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  it("should search municipalities", async () => {
    const locations = await service.searchMunicipalities("Rouen")
    expect(locations).toBeDefined()
    expect(Array.isArray(locations)).toBe(true)
    expect(locations[0].departmentCode).toBe("76")
    expect(locations[0].citycode).toBe("76540")
  })
})
