import type { Service } from "../types/service-search.types"

export class SimplifiedService {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly location: string,
    public readonly thematiques: string[],
    public readonly contact?: string,
  ) {}

  static fromService(service: Service): SimplifiedService {
    const location = [service.adresse, service.code_postal, service.commune]
      .filter(Boolean)
      .join(", ")

    const contact = service.telephone || service.courriel || service.page_web

    return new SimplifiedService(
      service.id,
      service.nom,
      service.description,
      location,
      service.thematiques,
      contact,
    )
  }

  static fromServices(services: Service[]): SimplifiedService[] {
    return services.map((service) => SimplifiedService.fromService(service))
  }
}
