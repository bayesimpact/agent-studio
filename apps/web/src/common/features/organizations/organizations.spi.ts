import type { Organization } from "./organizations.models"

export interface IOrganizationsSpi {
  createOne: (payload: { name: string }) => Promise<Organization>
}
