import axios from "axios"
import { getAccessToken } from "./auth0Client"
import { buildChatBotsApi, type IChatBotsApi } from "./chat-bots"
import { buildMeApi, type IMeApi } from "./me"
import { buildOrganizationsApi, type IOrganizationsApi } from "./organizations"
import { buildProjectsApi, type IProjectsApi } from "./projects"
import { buildTestApi, type ITestApi } from "./test"

export type IApi = {
  test: ITestApi
  me: IMeApi
  organizations: IOrganizationsApi
  projects: IProjectsApi
  chatBots: IChatBotsApi
}

const buildApi = ({ baseURL }: { baseURL: string }): IApi => {
  const axiosInstance = axios.create({ baseURL: `${baseURL}/` })

  // Set up request interceptor to automatically inject Auth0 access token
  // This ensures tokens are always fresh and handles refresh automatically
  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessToken()
        config.headers.Authorization = `Bearer ${token}`
      } catch (error) {
        // If token retrieval fails, let the request proceed without token
        // The API will return 401 and the error can be handled by the caller
        console.error("Failed to get access token for request:", error)
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  return {
    test: buildTestApi(axiosInstance),
    me: buildMeApi(axiosInstance),
    organizations: buildOrganizationsApi(axiosInstance),
    projects: buildProjectsApi(axiosInstance),
    chatBots: buildChatBotsApi(axiosInstance),
  }
}

export const api = buildApi({ baseURL: import.meta.env.VITE_API_URL as string })
