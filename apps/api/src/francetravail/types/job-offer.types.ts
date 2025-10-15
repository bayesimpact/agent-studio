export interface JobOfferLocation {
  libelle: string;
  latitude: number;
  longitude: number;
  codePostal: string;
  commune: string;
}

export interface JobOfferCompany {
  nom: string;
  description?: string;
  entrepriseAdaptee: boolean;
}

export interface JobOfferCompetence {
  code?: string;
  libelle: string;
  exigence: string;
}

export interface JobOfferFormation {
  niveauLibelle: string;
  exigence: string;
}

export interface JobOfferSalary {
  libelle?: string;
  commentaire?: string;
}

export interface JobOfferContact {
  nom?: string;
  coordonnees1?: string;
  courriel?: string;
  urlPostulation?: string;
}

export interface JobOfferOrigin {
  origine: string;
  urlOrigine: string;
}

export interface JobOfferContexteTravail {
  horaires?: string[];
}

export interface JobOfferQualite {
  libelle: string;
  description: string;
}

export interface JobOffer {
  id: string;
  intitule: string;
  description: string;
  dateCreation: string;
  dateActualisation: string;
  lieuTravail: JobOfferLocation;
  romeCode: string;
  romeLibelle: string;
  appellationlibelle: string;
  entreprise: JobOfferCompany;
  typeContrat: string;
  typeContratLibelle: string;
  natureContrat: string;
  experienceExige: string;
  experienceLibelle: string;
  competences?: JobOfferCompetence[];
  formations?: JobOfferFormation[];
  salaire?: JobOfferSalary;
  dureeTravailLibelle: string;
  dureeTravailLibelleConverti: string;
  alternance: boolean;
  contact?: JobOfferContact;
  agence: Record<string, unknown>;
  nombrePostes: number;
  accessibleTH: boolean;
  deplacementCode?: string;
  deplacementLibelle?: string;
  qualificationCode: string;
  qualificationLibelle: string;
  codeNAF: string;
  secteurActivite: string;
  secteurActiviteLibelle: string;
  qualitesProfessionnelles?: JobOfferQualite[];
  origineOffre: JobOfferOrigin;
  offresManqueCandidats?: boolean;
  contexteTravail?: JobOfferContexteTravail;
  entrepriseAdaptee: boolean;
  employeurHandiEngage: boolean;
}

export interface FilterAggregation {
  valeurPossible: string;
  nbResultats: number;
}

export interface FilterPossible {
  filtre: string;
  agregation: FilterAggregation[];
}

export interface JobSearchResponse {
  resultats: JobOffer[];
  filtresPossibles: FilterPossible[];
}