import { Injectable } from '@nestjs/common';
import axios from 'axios';
import qs from 'qs';
import { ServiceSearchResponse } from './types/service-search.types';
import { SimplifiedService } from './models/simplified-service.model';
import { Type } from '@google/genai';

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

export const servicesSearchDefinition = {
  name: 'services_search',
  description:
    'La recherche de services permet de trouver des services basé sur des thématiques.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      thematiques: {
        type: Type.ARRAY,
        description: 'Thematiques, possible de mettre plusieurs thématiques',
        items: {
          type: Type.STRING,
          enum: thematiques,
        },
      },
      cityName: {
        type: Type.ARRAY,
        description: 'City name in french',
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ['thematiques', 'cityName'],
  },
};

@Injectable()
export class DataInclusionService {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  private token = process.env.DATA_INCLUSION_TOKEN;
  private baseUrl = 'https://api.data.inclusion.beta.gouv.fr/api/v1';

  constructor() {}

  async searchServices({
    thematiques,
    codeCommune,
  }: {
    thematiques: string[];
    codeCommune: string;
  }): Promise<SimplifiedService[]> {
    const { data } = await axios.get<ServiceSearchResponse>(
      `${this.baseUrl}/search/services`,
      {
        params: {
          thematiques: thematiques,
          code_commune: codeCommune,
          size: 20,
        },
        paramsSerializer: (params) => {
          // Use qs to stringify the params
          // arrayFormat: 'repeat' ensures that arrays are formatted as key=1&key=2
          return qs.stringify(params, { arrayFormat: 'repeat' });
        },
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      },
    );

    const services = data.items.map((item) => item.service);
    return SimplifiedService.fromServices(services);
  }
}
