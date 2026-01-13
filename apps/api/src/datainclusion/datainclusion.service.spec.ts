import { ConfigModule } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { DataInclusionService } from "./datainclusion.service"

describe("DataInclusionService", () => {
  let service: DataInclusionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [DataInclusionService],
    }).compile()

    service = module.get<DataInclusionService>(DataInclusionService)
  })

  describe("searchServices", () => {
    it("should return services for given thematiques", async () => {
      const result = await service.searchServices({
        thematiques: [
          "choisir-un-metier--confirmer-son-choix-de-metier",
          "preparer-sa-candidature--realiser-un-cv-et-ou-une-lettre-de-motivation",
        ],
        codeCommune: "76540",
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Verify structure of simplified services
      result.forEach((service) => {
        expect(service.id).toBeDefined()
        expect(service.name).toBeDefined()
        expect(service.description).toBeDefined()
        expect(Array.isArray(service.thematiques)).toBe(true)
      })
    })
  })
})
