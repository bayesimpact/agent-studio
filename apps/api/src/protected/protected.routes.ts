import type { ResponseData } from "@/exports/dtos/generic"
import { defineRoute } from "@/helpers"

export const ProtectedRoutes = {
  getHello: defineRoute<ResponseData<string>>({
    method: "get",
    path: "protected/hello",
  }),
}
