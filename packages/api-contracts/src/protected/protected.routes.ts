import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"

export const ProtectedRoutes = {
  getHello: defineRoute<ResponseData<string>>({
    method: "get",
    path: "protected/hello",
  }),
}
