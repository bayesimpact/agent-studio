import { defineRoute } from "../../helpers";
import { ResponseData } from "../dtos/generic";

export const ProtectedRoutes = {
  getHello: defineRoute<ResponseData<string>>({
    method: 'get',
    path: 'protected/hello',
  }),
}
