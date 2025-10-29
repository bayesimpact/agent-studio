import { Test, TestingModule } from '@nestjs/testing';
import { AICarePlanBuilderService } from './care-plan-builder-ai.service';
import { CarePlanBuilderArgs } from './care-plan-builder.abstract';
import { NotionModule } from '../notion/notion.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { GeolocModule } from '../geoloc/geoloc.module';
import { ConfigModule } from '@nestjs/config';

describe('AICarePlanBuilderService', () => {
  let service: AICarePlanBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), NotionModule, FranceTravailModule, DataInclusionModule, GeolocModule],
      providers: [AICarePlanBuilderService],
    }).compile();

    service = module.get<AICarePlanBuilderService>(AICarePlanBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildCarePlan', () => {
    it('should generate a care plan from a simple profile text', async () => {
      const args: CarePlanBuilderArgs = {
        profileText:
          `Melvin,
          Vit chez ses parents à Rouen, réfugié était électricien
Dossier MDPH
FORMATION : CAP restauration collective, ASSR 1 et 2
EMPLOI : stages en restauration (3 mois)
RESSOURCES : Pas de ressource
MOBILITE : Permis B, mobile en voiture sur 30km
MOBILITE INTERNATIONALE : Pas intéressé
CEJ : La recherche d’emploi, la LM, entretien d’embauche, la confiance en soi, les démarches administratives
DIVERS : La randonné, jeux vidéo, jeux de construction`,
      };

      const result = await service.buildCarePlan(args);

      expect(result).toBeDefined();
      expect(result.carePlan).toBeDefined();
      expect(Array.isArray(result.carePlan)).toBe(true);
      expect(result.carePlan.length).toBeGreaterThan(0);


    });

  });

});