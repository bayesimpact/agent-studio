import axios from "axios"
import { buildTestApi, type ITestApi } from "./test"

interface IApi {
  setAccessToken: (accessToken: string) => void
  test: ITestApi
}

const buildApi = ({ baseURL }: { baseURL: string }): IApi => {
  const axiosInstance = axios.create({ baseURL: `${baseURL}/` })
  return {
    setAccessToken: (accessToken: string) => {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    },
    test: buildTestApi(axiosInstance),
  }
}

export const api = buildApi({ baseURL: import.meta.env.VITE_API_URL as string })
