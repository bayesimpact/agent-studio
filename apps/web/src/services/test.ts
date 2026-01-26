import { ProtectedRoutes } from "@caseai-connect/api-contracts"
import type { AxiosError, AxiosInstance } from "axios"
import { sleep } from "@/utils/sleep"

export interface ITestApi {
  getHello: () => Promise<string>
}

export const buildTestApi = (axios: AxiosInstance): ITestApi => ({
  getHello: async () => {
    try {
      await sleep(1000)
      const response = await axios.get<typeof ProtectedRoutes.getHello.response>(
        ProtectedRoutes.getHello.getPath(),
      )
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
