import { sleep } from '@/utils/sleep';
import { ProtectedRoutes } from 'api/api-routes/protected';
import type { AxiosError, AxiosInstance } from 'axios';

export interface ITestApi {
  getHello: () => Promise<string>;
}

export const buildTestApi = (axios: AxiosInstance): ITestApi => ({
  getHello: async () => {
    try {
      await sleep(1000)
      const response = await axios.get<typeof ProtectedRoutes.getHello.response>(ProtectedRoutes.getHello.getPath())
      return response.data.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
