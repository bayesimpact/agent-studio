import { Test, TestingModule } from '@nestjs/testing';
import { AIActionPlanBuilderService } from './action-plan-builder-ai.service';
import { ActionPlanBuilderArgs } from './action-plan-builder.abstract';
import { NotionModule } from '../notion/notion.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { GeolocModule } from '../geoloc/geoloc.module';
import { ConfigModule } from '@nestjs/config';

describe('AIActionPlanBuilderService', () => {
  let service: AIActionPlanBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), NotionModule, FranceTravailModule, DataInclusionModule, GeolocModule],
      providers: [AIActionPlanBuilderService],
    }).compile();

    service = module.get<AIActionPlanBuilderService>(AIActionPlanBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildActionPlan', () => {
    it('should generate an action plan from a simple profile text', async () => {
      const args: ActionPlanBuilderArgs = {
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

      const result = await service.buildActionPlan(args);

      expect(result).toBeDefined();
      expect(result.actionPlan).toBeDefined();
      expect(Array.isArray(result.actionPlan)).toBe(true);
      expect(result.actionPlan.length).toBeGreaterThan(0);


    });

  });

});