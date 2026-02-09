import { Factory } from "fishery"
import type { Organization } from "@/domains/organizations/organization.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import type { Project } from "@/domains/projects/project.entity"
import type { Resource } from "@/domains/resources/resource.entity"
import type { User } from "@/domains/users/user.entity"
import type {
  EndpointRequest,
  EndpointRequestWithProject,
  EndpointRequestWithResource,
  EndpointRequestWithUserMembership,
} from "@/request.interface"

type EndpointRequestTransientParams = {
  user: User
}

export const endpointRequestFactory = Factory.define<
  EndpointRequest,
  EndpointRequestTransientParams
>(({ transientParams }) => {
  const user = transientParams.user
  if (!user) {
    throw new Error("user transient is required")
  }
  return {
    user,
    jwtPayload: {
      sub: user.auth0Id,
      iss: "https://caseai.com",
      aud: ["https://caseai.com"],
      iat: Date.now(),
      exp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).getTime(),
      azp: "caseai",
      scope: "openid profile email",
    },
  } satisfies EndpointRequest
})

export const buildEndpointRequest = (user: User) => {
  return endpointRequestFactory.transient({ user }).build()
}

type EndpointRequestWithOrganizationTransientParams = {
  organization: Organization
  user: User
}

export const endpointRequestWithOrganizationFactory = Factory.define<
  EndpointRequestWithUserMembership,
  EndpointRequestWithOrganizationTransientParams
>(({ transientParams }) => {
  const organization = transientParams.organization
  const user = transientParams.user
  const baseRequest = endpointRequestFactory.transient({ user }).build()

  if (!organization) {
    throw new Error("organization transient is required")
  }

  return {
    ...baseRequest,
    organizationId: organization.id,
    userMembership: userMembershipFactory.transient({ organization, user }).build(),
  } satisfies EndpointRequestWithUserMembership
})

export const buildEndpointRequestWithOrganization = (organization: Organization, user: User) => {
  return endpointRequestWithOrganizationFactory
    .transient({ organization, user })
    .build() satisfies EndpointRequestWithUserMembership
}

type EndpointRequestWithOrganizationAndProjectTransientParams = {
  organization: Organization
  user: User
  project: Project
}

type EndpointRequestWithOrganizationAndProjectAndResourceTransientParams = {
  organization: Organization
  user: User
  project: Project
  resource: Resource
}

export const endpointRequestWithOrganizationAndProjectFactory = Factory.define<
  EndpointRequestWithProject,
  EndpointRequestWithOrganizationAndProjectTransientParams
>(({ transientParams }) => {
  const organization = transientParams.organization
  const user = transientParams.user
  const project = transientParams.project
  const baseRequest = endpointRequestWithOrganizationFactory
    .transient({ organization, user })
    .build()

  if (!project) {
    throw new Error("project transient is required")
  }

  return {
    ...baseRequest,
    project,
  } satisfies EndpointRequestWithProject
})

export const endpointRequestWithOrganizationAndProjectAndResourceFactory = Factory.define<
  EndpointRequestWithResource,
  EndpointRequestWithOrganizationAndProjectAndResourceTransientParams
>(({ transientParams }) => {
  const organization = transientParams.organization
  const user = transientParams.user
  const project = transientParams.project
  const resource = transientParams.resource
  const baseRequest = endpointRequestWithOrganizationFactory
    .transient({ organization, user })
    .build()

  if (!project) {
    throw new Error("project transient is required")
  }

  if (!resource) {
    throw new Error("resource transient is required")
  }

  return {
    ...baseRequest,
    project,
    resource,
  } satisfies EndpointRequestWithResource
})

export const buildEndpointRequestWithOrganizationAndProject = (
  organization: Organization,
  user: User,
  project: Project,
) => {
  return endpointRequestWithOrganizationAndProjectFactory
    .transient({ organization, user, project })
    .build()
}

export const buildEndpointRequestWithOrganizationAndProjectAndResource = (params: {
  organization: Organization
  user: User
  project: Project
  resource: Resource
}) => {
  return endpointRequestWithOrganizationAndProjectAndResourceFactory.transient(params).build()
}
