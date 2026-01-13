export interface LaBonneBoiteLocation {
  lat: number
  lon: number
}

export interface LaBonneBoiteCompany {
  rome: string
  id: number
  siret: string
  email: "yes" | "no"
  company_name: string
  office_name: string
  headcount_min: number
  headcount_max: number
  naf: string
  naf_label: string
  location: LaBonneBoiteLocation
  city: string
  citycode: string
  postcode: string
  department: string
  region: string
  department_number: string
  hiring_potential: number
  is_high_potential: boolean
}

export interface LaBonneBoiteJob {
  type: string
  value: string
  display: string
  selection: string
}

export interface LaBonneBoiteResolvedParams {
  jobs: LaBonneBoiteJob[]
  locations: string[]
}

export interface LaBonneBoiteParams {
  rome: string[]
  city: string[]
  page: number
  page_size: number
  sort_by: string
  sort_direction: string
}

export interface LaBonneBoiteResponse {
  hits: number
  items: LaBonneBoiteCompany[]
  params: LaBonneBoiteParams
  resolved_params: LaBonneBoiteResolvedParams
}
