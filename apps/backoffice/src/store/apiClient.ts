import type { ApiRoute } from "@caseai-connect/api-contracts"

type Params<T extends ApiRoute> = {
  route: T
  payload?: T["request"]
  token?: string
  pathParams?: Record<string, string>
}

export async function apiRequest<T extends ApiRoute>({
  route,
  payload,
  token,
  pathParams,
}: Params<T>): Promise<T["response"]> {
  const method = route.method.toUpperCase()
  const path = pathParams ? route.getPath(pathParams) : route.getPath()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const body =
    payload && (route.method === "post" || route.method === "put" || route.method === "patch")
      ? JSON.stringify(payload)
      : undefined

  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    headers,
    body,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }))
    throw error
  }

  return res.json()
}
