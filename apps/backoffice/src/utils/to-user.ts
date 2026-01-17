import type { User as UserDTO } from "@auth0/auth0-react"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"

export function toUser(user: UserDTO): User {
  return {
    name: user.nickname || user.name || "Unknown name",
    email: user.email || "Unknown email",
    avatar: user.picture,
  }
}

/**
 * Converts Redux me state user to sidebar User type
 */
export function meStateToUser(
  meUser: { id: string; email: string; name: string | null } | null,
): User | null {
  if (!meUser) {
    return null
  }

  return {
    name: meUser.name || "Unknown name",
    email: meUser.email,
    avatar: undefined, // Avatar is not stored in Redux state currently
  }
}
