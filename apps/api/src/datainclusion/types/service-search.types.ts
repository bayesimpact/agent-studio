export interface ServiceSearchResult {
  service: Service
  distance?: number
}

export interface Service {
  source: string
  id: string
  structure_id: string
  nom: string
  description: string
  type: string
  thematiques: string[]
  frais?: string
  publics?: string[]
  commune?: string
  code_postal?: string
  latitude?: number
  longitude?: number
  telephone?: string
  courriel?: string
  contact_public?: boolean
  adresse?: string
  complement_adresse?: string
  cumulable?: boolean
  date_creation?: string
  date_maj?: string
  date_suspension?: string
  formulaire_en_ligne?: string
  justificatifs?: string[]
  liens_externes?: string[]
  lien_source?: string
  modes_accueil?: string[]
  modes_orientation_accompagnateur?: string[]
  modes_orientation_beneficiaire?: string[]
  page_web?: string
  pre_requis?: string[]
  profils?: string[]
  prise_rdv?: string
  recurrence?: string
  structure_parent?: string
  zone_diffusion_code?: string
  zone_diffusion_nom?: string
  zone_diffusion_type?: string
}

export interface ServiceSearchResponse {
  items: ServiceSearchResult[]
  total: number
  page: number
  size: number
  pages: number
}
