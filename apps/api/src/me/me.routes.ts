import type { MeResponseDto } from "@repo/api"
import type { ResponseData } from "@/exports/dtos/generic"
import { defineRoute } from "@/helpers"

export const MeRoutes = {
  getMe: defineRoute<ResponseData<MeResponseDto>>({
    path: "me",
    method: "get",
  }),
}
