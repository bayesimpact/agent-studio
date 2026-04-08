export type Notification = {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "info" | "warning"
}
