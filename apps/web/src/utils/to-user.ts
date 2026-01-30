import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import type { Me } from "@/features/me/me.models"
import { ADS, type AsyncData } from "@/store/async-data-status"

/**
 * Converts Redux me state user to sidebar User type
 */
export function meStateToUser(meUser: AsyncData<Me["user"]>, admin: boolean): User | null {
  if (!ADS.isFulfilled(meUser)) {
    return null
  }

  return {
    name: meUser.value.name || "Unknown name",
    email: meUser.value.email,
    avatar: undefined, // Avatar is not stored in Redux state currently
    admin,
  }
}
