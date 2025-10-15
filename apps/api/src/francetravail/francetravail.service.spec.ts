import { Test, TestingModule } from '@nestjs/testing';
import { FranceTravailService } from './francetravail.service';
import { ConfigModule } from '@nestjs/config';

describe('FranceTravailService', () => {
  let service: FranceTravailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [FranceTravailService],
    }).compile();

    service = module.get<FranceTravailService>(FranceTravailService);
  });

  describe('searchJobOffers', () => {
    it('should return job offers', async () => {
      const result = await service.searchJobOffers({
        jobTitles: ['métiers du jeu vidéo'],
        departmentsCode: ["75"]
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

    });
  });
});