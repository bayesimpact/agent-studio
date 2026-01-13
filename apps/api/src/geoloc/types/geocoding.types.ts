export interface GeocodingFeature {
  type: string
  geometry: {
    type: string
    coordinates: number[]
  }
  properties: {
    label: string
    score: number
    housenumber?: string
    id: string
    name: string
    postcode?: string
    citycode?: string
    x: number
    y: number
    city?: string
    district?: string
    context: string
    type: string
    importance: number
    street?: string
    municipality?: string
    department?: string
    region?: string
  }
}

export interface GeocodingResponse {
  type: string
  version: string
  features: GeocodingFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}
