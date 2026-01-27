import type { Organization } from "./organizations.models"

export interface IOrganizationsSpi {
  createOrganization: (payload: { name: string }) => Promise<Organization>
}
