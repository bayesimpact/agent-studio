import { Injectable } from '@nestjs/common';
import {
  AbstractActionPlanBuilderService,
  Action,
  ActionPlanBuilderArgs,
  ActionPlanBuilderOptions,
} from './action-plan-builder.abstract';

@Injectable()
export class StaticActionPlanBuilderService extends AbstractActionPlanBuilderService {
  async buildActionPlan(
    args: ActionPlanBuilderArgs,
    options?: ActionPlanBuilderOptions,
  ): Promise<{ actionPlan: Action[] }> {
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

    // Static mock action plan
    const actionPlan: Action[] = [
      {
        id: '1',
        categories: ['Emploi', 'Formation'],
        title: 'Mise à jour du CV',
        content:
          'Actualiser votre CV en mettant en avant vos compétences récentes et expériences pertinentes pour le secteur visé.',
        cta: {
          name: 'Prendre rendez-vous',
          type: 'url',
          value: 'https://example.com/cv-workshop',
        },
      },
      {
        id: '2',
        categories: ['Emploi', 'Réseau'],
        title: 'Développer son réseau professionnel',
        content:
          'Participer à des événements de networking et rejoindre des groupes professionnels sur LinkedIn.',
        cta: {
          name: 'Appeler le conseiller',
          type: 'phone',
          value: '+33123456789',
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
          type: 'url',
          value: 'https://example.com/formations',
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
          name: 'Contacter par email',
          type: 'email',
          value: 'conseil@example.fr',
        },
      },
    ];

    return { actionPlan };
  }
}