export type MeResponseDto = {
  user: {
    id: string
    email: string
    name: string | null
  }
  organizations: Array<{
    id: string
    name: string
    role: string
  }>
}
