import { Factory } from "fishery"
import type { EndpointRequest } from "@/request.interface"
import type { User } from "@/users/user.entity"

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
