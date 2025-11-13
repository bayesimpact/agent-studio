export type Language = 'fr' | 'en'

export interface Translations {
  common: {
    appName: string
  }
  chat: {
    placeholder: string
    processingRequest: string
    replying: string
    processing: string
    failedToInitialize: string
    errorOccurred: string
    details: string
    noProgressInfo: string
  }
  actionPlan: {
    title: string
    emptyMessage: string
  }
  functions: {
    fetchBeneficiaryProfile: string
  }
  country: {
    france: string
    unitedStates: string
  }
}

export const translations: Record<Language, Translations> = {
  fr: {
    common: {
      appName: 'CaseAI Connect',
    },
    chat: {
      placeholder: 'Tapez votre message...',
      processingRequest: 'Traitement de la demande...',
      replying: 'Réponse en cours...',
      processing: 'Traitement...',
      failedToInitialize: 'Échec de l\'initialisation du chat. Veuillez rafraîchir la page.',
      errorOccurred: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
      details: 'Détails',
      noProgressInfo: 'Aucune information de progression disponible',
    },
    actionPlan: {
      title: 'Plan d\'action',
      emptyMessage: 'Votre plan d\'action apparaîtra ici une fois créé.',
    },
    functions: {
      fetchBeneficiaryProfile: 'Récupération du profil dans Notion',
    },
    country: {
      france: 'France',
      unitedStates: 'États-Unis',
    },
  },
  en: {
    common: {
      appName: 'CaseAI Connect',
    },
    chat: {
      placeholder: 'Type your message...',
      processingRequest: 'Processing request...',
      replying: 'Replying...',
      processing: 'Processing...',
      failedToInitialize: 'Failed to initialize chat. Please refresh the page.',
      errorOccurred: 'Sorry, something went wrong. Please try again.',
      details: 'Details',
      noProgressInfo: 'No progress information available',
    },
    actionPlan: {
      title: 'Action plan',
      emptyMessage: 'Your action plan will appear here.',
    },
    functions: {
      fetchBeneficiaryProfile: 'Fetching profile in Notion',
    },
    country: {
      france: 'France',
      unitedStates: 'United States',
    },
  },
}

export function getTranslations(language: Language): Translations {
  return translations[language]
}