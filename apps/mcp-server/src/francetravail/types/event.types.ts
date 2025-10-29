export interface EventSearchResponse {
  totalElements?: number;
  content?: Event[];
}

export interface Event {
  id?: number;
  titre?: string;
  description?: string;
  dateEvenement?: string;
  heureDebut?: string;
  heureFin?: string;
  timezone?: string;
  ville?: string;
  codePostal?: string;
  codeInsee?: string;
  longitude?: number;
  latitude?: number;
  type?: string;
  modalites?: string[];
  operations?: string[];
  diplomes?: string[] | null;
  objectifs?: string[];
  publics?: string[];
  benefices?: string[] | null;
  deroulement?: string;
  nombrePlaceTotalDistance?: number;
  nombrePlaceTotalPresentiel?: number;
  nombreInscritDistance?: number;
  nombreInscritPresentiel?: number;
  nombrePreinscritDistance?: number;
  nombrePreinscritPresentiel?: number;
  codesRome?: string[];
  multisectoriel?: boolean;
  offresId?: string[] | null;
  urlDetailEvenement?: string;
  libelleEtablissement?: string;
  libelleOrganisateurPrincipal?: string;
}