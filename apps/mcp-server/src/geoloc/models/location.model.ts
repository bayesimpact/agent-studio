import { GeocodingFeature } from '../types/geocoding.types.js';

export class Location {
  constructor(
    public readonly label: string,
    public readonly name: string,
    public readonly postcode?: string,
    public readonly citycode?: string,
    public readonly city?: string,
    public readonly department?: string,
    public readonly departmentCode?: string,
    public readonly region?: string,
    public readonly coordinates?: { lat: number; lon: number },
    public readonly score?: number,
    public readonly type?: string,
  ) {}

  static fromGeocodingFeature(feature: GeocodingFeature): Location {
    const departmentCode = feature.properties.citycode?.substring(0, 2);
    const coordinates = feature.geometry?.coordinates
      ? {
          lon: feature.geometry.coordinates[0] || 0,
          lat: feature.geometry.coordinates[1] || 0,
        }
      : { lon: 0, lat: 0 };

    return new Location(
      feature.properties.label,
      feature.properties.name,
      feature.properties.postcode,
      feature.properties.citycode,
      feature.properties.city || feature.properties.municipality,
      feature.properties.department,
      departmentCode,
      feature.properties.region,
      coordinates,
      feature.properties.score,
      feature.properties.type,
    );
  }

  static fromGeocodingFeatures(features: GeocodingFeature[]): Location[] {
    return features.map((feature) => Location.fromGeocodingFeature(feature));
  }
}
