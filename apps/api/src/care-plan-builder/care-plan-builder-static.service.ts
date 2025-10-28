import { Injectable } from '@nestjs/common';
import {
  AbstractCarePlanBuilderService,
  Action,
  CarePlanBuilderArgs,
  CarePlanBuilderOptions,
} from './care-plan-builder.abstract';

@Injectable()
export class StaticCarePlanBuilderService extends AbstractCarePlanBuilderService {
  async buildCarePlan(
    args: CarePlanBuilderArgs,
    options?: CarePlanBuilderOptions,
  ): Promise<{ carePlan: Action[] }> {
    // Simulate progress reporting with markdown headers
    options?.onProgress?.('## Analyse du profil');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    options?.onProgress?.('Extraction des informations clés du bénéficiaire...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    options?.onProgress?.('## Génération des actions');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    options?.onProgress?.('Création d\'actions personnalisées basées sur le profil...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    options?.onProgress?.('## Finalisation');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    options?.onProgress?.('Structuration du plan d\'accompagnement...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Static mock care plan
    const carePlan: Action[] = [
      {
        id: '1',
        categories: ['Emploi', 'Formation'],
        title: 'Mise à jour du CV',
        content:
          'Actualiser votre CV en mettant en avant vos compétences récentes et expériences pertinentes pour le secteur visé.',
        cta: {
          name: 'Prendre rendez-vous',
          link: 'https://example.com/cv-workshop',
        },
      },
      {
        id: '2',
        categories: ['Emploi', 'Réseau'],
        title: 'Développer son réseau professionnel',
        content:
          'Participer à des événements de networking et rejoindre des groupes professionnels sur LinkedIn.',
        cta: {
          name: 'Voir les événements',
        },
      },
      {
        id: '3',
        categories: ['Formation'],
        title: 'Formation complémentaire',
        content:
          'Identifier et suivre une formation pour renforcer vos compétences dans votre domaine cible.',
        cta: {
          name: 'Explorer les formations',
          link: 'https://example.com/formations',
        },
      },
      {
        id: '4',
        categories: ['Emploi'],
        title: 'Postuler à des offres ciblées',
        content:
          "Rechercher et postuler à minimum 5 offres d'emploi correspondant à votre profil chaque semaine.",
      },
      {
        id: '5',
        categories: ['Social', 'Administratif'],
        title: 'Vérifier ses droits sociaux',
        content:
          "S'assurer que tous les droits sociaux (allocations, aides au logement, etc.) sont à jour et optimisés.",
        cta: {
          name: 'Prendre rendez-vous',
        },
      },
    ];

    return { carePlan };
  }
}