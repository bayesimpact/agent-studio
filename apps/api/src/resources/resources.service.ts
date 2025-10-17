import { Injectable } from '@nestjs/common';
import { Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { AIServiceProvider } from '../common/interfaces/ai-service.interface';
import { Location } from '../geoloc/models/location.model';
import { FranceTravailService } from '../francetravail/francetravail.service';
import { DataInclusionService } from '../datainclusion/datainclusion.service';

const thematiques = [
  'choisir-un-metier--confirmer-son-choix-de-metier',
  'choisir-un-metier--connaitre-les-opportunites-demploi',
  'choisir-un-metier--decouvrir-un-metier-ou-un-secteur-dactivite',
  'choisir-un-metier--identifier-ses-points-forts-et-ses-competences',
  'creer-une-entreprise--definir-son-projet-de-creation-dentreprise',
  'creer-une-entreprise--developper-son-entreprise',
  'creer-une-entreprise--structurer-son-projet-de-creation-dentreprise',
  'difficultes-administratives-ou-juridiques--accompagnement-aux-demarches-administratives',
  'difficultes-administratives-ou-juridiques--accompagnement-pour-lacces-a-la-citoyennete',
  'difficultes-administratives-ou-juridiques--accompagnement-pour-lacces-aux-droits',
  'difficultes-administratives-ou-juridiques--beneficier-dune-mesure-daccompagnement-adapte',
  'difficultes-administratives-ou-juridiques--connaitre-ses-droits-face-a-une-discrimination',
  'difficultes-administratives-ou-juridiques--prendre-en-compte-une-problematique-judiciaire',
  'difficultes-financieres--acquerir-une-autonomie-budgetaire',
  'difficultes-financieres--ameliorer-sa-gestion-budgetaire',
  'difficultes-financieres--mettre-en-place-une-mesure-de-protection-financiere',
  'difficultes-financieres--prevenir-une-degradation-de-la-situation-financiere',
  'difficultes-financieres--situation-dendettement-surendettement',
  'equipement-et-alimentation--aide-menagere',
  'equipement-et-alimentation--alimentation',
  'equipement-et-alimentation--electromenager',
  'equipement-et-alimentation--habillement',
  'famille--garde-denfants',
  'famille--prise-en-charge-personne-dependante',
  'famille--soutien-a-la-parentalite-et-a-leducation',
  'famille--soutien-aidants',
  'famille--surmonter-conflits-separation-violence',
  'lecture-ecriture-calcul--maitriser-le-calcul',
  'lecture-ecriture-calcul--maitriser-le-francais',
  'logement-hebergement--acheter-un-logement',
  'logement-hebergement--changer-de-logement',
  'logement-hebergement--louer-un-logement',
  'logement-hebergement--rechercher-une-solution-dhebergement-temporaire',
  'logement-hebergement--reduire-les-impayes-de-loyer',
  'logement-hebergement--se-maintenir-dans-le-logement',
  'logement-hebergement--sinformer-sur-les-demarches-liees-a-lacces-au-logement',
  'mobilite--acceder-a-un-vehicule',
  'mobilite--entretenir-reparer-son-vehicule',
  'mobilite--etre-accompagne-dans-son-parcours-mobilite',
  'mobilite--financer-ma-mobilite',
  'mobilite--preparer-un-permis-de-conduire',
  'mobilite--utiliser-des-services-de-mobilite-partagee',
  'numerique--acceder-a-des-services-en-ligne',
  'numerique--acceder-a-une-connexion-internet',
  'numerique--acquerir-un-equipement',
  'numerique--maitriser-les-fondamentaux-du-numerique',
  'preparer-sa-candidature--developper-son-reseau',
  'preparer-sa-candidature--organiser-ses-demarches-de-recherche-demploi',
  'preparer-sa-candidature--realiser-un-cv-et-ou-une-lettre-de-motivation',
  'preparer-sa-candidature--valoriser-ses-competences',
  'remobilisation--activites-sportives-et-culturelles',
  'remobilisation--benevolat-action-citoyenne',
  'remobilisation--bien-etre-confiance-en-soi',
  'remobilisation--lien-social',
  'sante--acces-aux-soins',
  'sante--addictions',
  'sante--constituer-un-dossier-mdph-invalidite',
  'sante--sante-mentale',
  'sante--sante-sexuelle',
  'se-former--monter-son-dossier-de-formation',
  'se-former--trouver-sa-formation',
  'souvrir-a-linternational--connaitre-les-opportunites-demploi-a-letranger',
  'souvrir-a-linternational--sinformer-sur-les-aides-pour-travailler-a-letranger',
  'souvrir-a-linternational--sorganiser-suite-a-son-retour-en-france',
  'trouver-un-emploi--convaincre-un-recruteur-en-entretien',
  'trouver-un-emploi--faire-des-candidatures-spontanees',
  'trouver-un-emploi--maintien-dans-lemploi',
  'trouver-un-emploi--repondre-a-des-offres-demploi',
  'trouver-un-emploi--suivre-ses-candidatures-et-relancer-les-employeurs',
];

@Injectable()
export class ResourcesService implements AIServiceProvider {
  constructor(
    private franceTravailService: FranceTravailService,
    private dataInclusionService: DataInclusionService,
  ) {}

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: 'search_resources',
      description:
        'Recherche unifiée de ressources (offres d\'emploi ou services d\'accompagnement) selon le type de besoin du bénéficiaire.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          provider: {
            type: Type.STRING,
            description: 'Type de ressources à rechercher',
            enum: ['jobs', 'services'],
          },
          cityName: {
            type: Type.ARRAY,
            description: 'Nom de la ville en français (obligatoire)',
            items: {
              type: Type.STRING,
            },
          },
          // For jobs provider
          jobTitles: {
            type: Type.ARRAY,
            description: 'Titres de postes recherchés en français (requis si provider="jobs")',
            items: {
              type: Type.STRING,
            },
          },
          // For services provider
          thematiques: {
            type: Type.ARRAY,
            description: 'Thématiques de services (requis si provider="services")',
            items: {
              type: Type.STRING,
              enum: thematiques,
            },
          },
        },
        required: ['provider', 'cityName'],
      },
    };
  }

  getPromptContext(): string {
    return `
### Outil: \`search_resources\`
**Description**: Recherche unifiée de ressources d'accompagnement - offres d'emploi OU services sociaux.

**Paramètres**:
- \`provider\`: Type de recherche
  - \`"jobs"\`: Recherche d'offres d'emploi via France Travail
  - \`"services"\`: Recherche de services d'accompagnement via Data Inclusion
- \`cityName\`: Nom de la ville (obligatoire - demande si non fourni)

**Si provider="jobs"**:
- \`jobTitles\`: 2-5 titres de postes pertinents en français
  - Exemples: ["développeur web", "développeur full stack"], ["chauffeur de bus", "conducteur"]

**Si provider="services"**:
- \`thematiques\`: Liste de thématiques exactes parmi l'enum disponible
  - Tu peux sélectionner plusieurs thématiques si la situation est complexe
  - Exemples: ["logement-hebergement--reduire-les-impayes-de-loyer"], ["preparer-sa-candidature--realiser-un-cv-et-ou-une-lettre-de-motivation", "trouver-un-emploi--convaincre-un-recruteur-en-entretien"]

**Retourne**:
- Pour jobs: Liste d'offres avec id, titre, entreprise, localisation, type de contrat, description (jusqu'à 20 résultats)
- Pour services: Liste de services avec id, nom, description, localisation, type de service, contact (jusqu'à 20 résultats)
`;
  }

  async executeFunction(
    functionCall: FunctionCall,
    locations: Location[],
  ): Promise<any> {
    const provider = functionCall.args['provider'] as string;

    if (provider === 'jobs') {
      const jobTitles = functionCall.args['jobTitles'] as string[];
      if (!jobTitles || jobTitles.length === 0) {
        throw new Error('jobTitles is required when provider is "jobs"');
      }
      return await this.franceTravailService.executeFunction(
        {
          ...functionCall,
          name: 'jobs_search',
          args: { jobTitles, cityName: functionCall.args['cityName'] },
        },
        locations,
      );
    } else if (provider === 'services') {
      const thematiques = functionCall.args['thematiques'] as string[];
      if (!thematiques || thematiques.length === 0) {
        throw new Error('thematiques is required when provider is "services"');
      }
      return await this.dataInclusionService.executeFunction(
        {
          ...functionCall,
          name: 'services_search',
          args: { thematiques, cityName: functionCall.args['cityName'] },
        },
        locations,
      );
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }
}