import axios from "axios"
import { buildMeApi, type IMeApi } from "./me"
import { buildOrganizationsApi, type IOrganizationsApi } from "./organizations"
import { buildProjectsApi, type IProjectsApi } from "./projects"
import { buildTestApi, type ITestApi } from "./test"

interface IApi {
  setAccessToken: (accessToken: string) => void
  test: ITestApi
  me: IMeApi
  organizations: IOrganizationsApi
  projects: IProjectsApi
}

const buildApi = ({ baseURL }: { baseURL: string }): IApi => {
  const axiosInstance = axios.create({ baseURL: `${baseURL}/` })
  return {
    setAccessToken: (accessToken: string) => {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    },
    test: buildTestApi(axiosInstance),
    me: buildMeApi(axiosInstance),
    organizations: buildOrganizationsApi(axiosInstance),
    projects: buildProjectsApi(axiosInstance),
  }
}

export const api = buildApi({ baseURL: import.meta.env.VITE_API_URL as string })
