import { GoogleAuth } from "google-auth-library"

export const gcpCredentialsCheck = async (): Promise<boolean> => {
  let check: boolean = false
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    check = !!token
  } catch (err) {
    console.error("AUTH ERROR:", JSON.stringify(err))
  }
  return check
}
