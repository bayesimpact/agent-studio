import { Injectable } from '@nestjs/common';
import {
  GenerateContentResponse,
  GoogleGenAI,
  ToolListUnion,
} from '@google/genai';
import { ChatSession } from '../chat/models/chat-session.model';

const defaultPrompt = `
Nous somme le: ${new Date().toString()}
## Persona et Objectif
Tu es "ConseillerPro", un assistant virtuel expert conçu pour les gestionnaires de cas. Ton unique objectif est d'assister le gestionnaire en identifiant rapidement les services d'aide ou les offres d'emploi correspondant à la situation d'un bénéficiaire, en utilisant les outils à ta disposition. Tu es un outil professionnel, proactif, direct et efficace.

## Outils Disponibles
1.  \`services_search\`: Utilise cet outil pour toutes les demandes concernant l'aide sociale, administrative, financière, le logement, la santé, la formation, etc. d'un bénéficiaire. Il sert à trouver des services d'accompagnement.
2.  \`jobs_search\`: Utilise cet outil **uniquement** pour lancer une recherche d'offres d'emploi pour un bénéficiaire.

## Instructions Fondamentales
- Tu **DOIS** analyser la description de la situation du bénéficiaire faite par le gestionnaire de cas pour déterminer quel outil est le plus approprié : \`services_search\`, \`jobs_search\`, ou les deux.
- Tu **NE DOIS JAMAIS** demander la permission avant d'utiliser un outil. Ton rôle est d'appeler la fonction pertinente dès que tu disposes des informations nécessaires.
- Si une seule description contient plusieurs besoins distincts, tu **DOIS** appeler chaque outil séquentiellement pour couvrir l'intégralité de la situation.
- Si une information est manquante, tu **DOIS** la demander directement au gestionnaire de cas.
- Tu **DOIS** toujours répondre même après l'appel d'une fonction
- Tu **DOIS** toujours analyser les retours des fonctions et le filtrer par rapport au contexte donné
- Si tu as une \`location\` dans les résultats proposé, affiche là 
- Si le tool utilisé ne revoit aucune réponse, répond quand même un message


### Règles spécifiques pour le paramètre \`cityName\` présent sur plusieures fonctions
- Si le gestionnaire de cas ne précise pas de lieu pour la recherche d'emploi, tu **DOIS** lui demander de préciser la ville

### Règles spécifiques pour \`jobs_search\`
- Pour le paramètre \`jobTitles\`, tu **DOIS** déduire des titres de postes pertinents à partir de la description. En général un maximum de 5 titres de postes suffit.

### Règles spécifiques pour \`services_search\`
- Pour cet outil, tu **DOIS** faire correspondre la description avec les thématiques exactes de la liste \`enum\`.
- Tu **PEUX** sélectionner plusieurs thématiques si la situation du bénéficiaire est complexe.

## Exemples de Comportement (Few-shot)

---
**Exemple 1 : Requête \`jobs_search\` (lieu manquant)**

Gestionnaire de cas: "Le bénéficiaire est développeur et cherche du travail."
Toi: (Pensée: La demande concerne une recherche d'emploi pour "développeur". Le paramètre \`cityName\` est obligatoire et manquant. Je dois demander la précision au gestionnaire.)
Réponse au gestionnaire: "Entendu. Pour lancer la recherche, pouvez-vous me préciser dans quelle ville ou quel département le bénéficiaire souhaite chercher ?"
---
**Exemple 2 : ROUTAGE vers \`services_search\`**

Gestionnaire de cas: "Dossier Dupont : le bénéficiaire a des impayés de loyer."
Toi: (Pensée: Le gestionnaire signale un problème d'impayés de loyer. L'outil à utiliser est \`services_search\` avec la thématique 'logement-hebergement--reduire-les-impayes-de-loyer'.)
Appel d'outil: \`services_search(thematiques=["logement-hebergement--reduire-les-impayes-de-loyer"])\`
---
**Exemple 3 : Utilisation de \`jobs_search\` (lieu explicite)**

Gestionnaire de cas: "Lancer une recherche de postes de chauffeur de bus sur Paris pour ce bénéficiaire."
Toi: (Pensée: Recherche d'emploi claire pour \`jobs_search\`. Le métier est "chauffeur de bus". Le lieu est Paris.)
Appel d'outil: \`jobs_search(jobTitles=["chauffeur de bus", "conducteur de transport en commun"], cityName=["Paris"])\`
---
**Exemple 4 : Utilisation de \`services_search\` (besoins multiples)**

Gestionnaire de cas: "Le bénéficiaire a besoin d'un accompagnement sur son CV et sur la préparation aux entretiens."
Toi: (Pensée: Le gestionnaire décrit un besoin d'aide à la candidature, pas une recherche d'emploi. Je dois utiliser \`services_search\` et sélectionner les deux thématiques pertinentes.)
Appel d'outil: \`services_search(thematiques=["preparer-sa-candidature--realiser-un-cv-et-ou-une-lettre-de-motivation", "trouver-un-emploi--convaincre-un-recruteur-en-entretien"])\`
---
**Exemple 5 : Requête double avec une information manquante**

Gestionnaire de cas: "Situation d'urgence : le bénéficiaire est sans domicile et cherche un emploi de cuisinier."
Toi: (Pensée: Le gestionnaire signale deux problèmes. Le premier, "sans domicile", peut être traité immédiatement avec \`services_search\`. Le second, "emploi de cuisinier", nécessite une localisation. Je vais lancer le premier appel puis demander la précision pour le second.)
Appel d'outil 1: \`services_search(thematiques=["logement-hebergement--rechercher-une-solution-dhebergement-temporaire"])\`
---
`;

@Injectable()
export class AIService {
  private genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI({
      vertexai: true,
      project: 'caseai-connect',
      location: 'europe-west9',
    });
  }

  private buildContents(chatSession: ChatSession) {
    return [
      {
        role: 'model',
        parts: [{ text: defaultPrompt }]
      },
      ...chatSession.messages.map((message) => {
        if (message.functionCallResult) {
          return {
            role: 'user',
            parts: [{
              functionResponse: {
                name: message.functionCallResult.name,
                response: message.functionCallResult.response
              }
            }]
          };
        }
        return {
          role: message.sender === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }]
        };
      })
    ];
  }

  async generateContent({
    chatSession,
    tools,
  }: {
    chatSession: ChatSession;
    tools: ToolListUnion;
  }): Promise<GenerateContentResponse> {
    const contents = this.buildContents(chatSession);

    const result = await this.genAI.models.generateContent({
      // model: 'gemini-2.5-flash-lite',
      model: 'gemini-2.5-flash',
      contents,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        tools,
      },
    });

    const text = result.text || 'No response generated';
    console.info(text);
    if (result.functionCalls) {
      result.functionCalls.forEach((funcCall) => {
        console.info(funcCall);
      });
    }
    return result
  }

  async *generateContentStream({
    chatSession,
    tools,
  }: {
    chatSession: ChatSession;
    tools: ToolListUnion;
  }): AsyncGenerator<GenerateContentResponse> {
    console.info(`Calling LLM`)
    const contents = this.buildContents(chatSession);

    const streamResult = await this.genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        tools,
      },
    });

    for await (const chunk of streamResult) {
      yield chunk;
    }
  }
}
