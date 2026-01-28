import type { User as UserDTO } from "@auth0/auth0-react"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import type { Me } from "@/features/me/me.models"
import { ADS, type AsyncData } from "@/store/async-data-status"

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
export function meStateToUser(meUser: AsyncData<Me["user"]>): User | null {
  if (!ADS.isFulfilled(meUser)) {
    return null
  }

  return {
    name: meUser.value.name || "Unknown name",
    email: meUser.value.email,
    avatar: undefined, // Avatar is not stored in Redux state currently
  }
}
