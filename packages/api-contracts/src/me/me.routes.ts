import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { MeResponseDto } from "./me.dto"

export const MeRoutes = {
  getMe: defineRoute<ResponseData<MeResponseDto>>({
    path: "me",
    method: "get",
  }),
}
