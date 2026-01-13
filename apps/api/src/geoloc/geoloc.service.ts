import { Injectable } from "@nestjs/common"
import axios from "axios"
import { Location } from "./models/location.model"
import type { GeocodingResponse } from "./types/geocoding.types"

export interface GeocodingSearchParams {
  query: string
}

@Injectable()
export class GeolocService {
  private readonly baseUrl = "https://data.geopf.fr/geocodage/search"

  private async search({ query }: GeocodingSearchParams): Promise<Location[]> {
    try {
      const { data } = await axios.get<GeocodingResponse>(this.baseUrl, {
        params: {
          q: query,
          type: "municipality",
          autocomplete: "0",
        },
        headers: {
          accept: "application/json",
        },
      })

      return Location.fromGeocodingFeatures(data.features)
    } catch (error) {
      console.error("Error searching locations:", error)
      throw new Error("Failed to search locations")
    }
  }

  async searchMunicipalities(city: string): Promise<Location[]> {
    return this.search({
      query: city,
    })
  }
}
