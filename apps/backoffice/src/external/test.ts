import { sleep } from '@/utils/sleep';
import type { AxiosError, AxiosInstance } from 'axios';

export interface ITestApi {
  getHello: () => Promise<string>;
}

export const buildTestApi = (axios: AxiosInstance): ITestApi => ({
  getHello: async () => {
    try {
      await sleep(1000)
      const response = await axios.get<string>('/protected/hello')
      return response.data
    } catch (apiError) {
      return Promise.reject(apiError as AxiosError)
    }
  },
})
