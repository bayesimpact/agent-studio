import { defineRoute } from "../../helpers"
import type { ResponseData } from "../dtos/generic"

export const ProtectedRoutes = {
  getHello: defineRoute<ResponseData<string>>({
    method: "get",
    path: "protected/hello",
  }),
}
