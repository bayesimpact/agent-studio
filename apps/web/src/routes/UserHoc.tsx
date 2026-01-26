import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { selectMe } from "@/features/me/me.selectors"
import { useAppSelector } from "@/store/hooks"
import { meStateToUser } from "@/utils/to-user"
import { LoadingRoute } from "./LoadingRoute"

export function UserHoc({ children }: { children: (user: User) => React.ReactNode }) {
  const meUser = useAppSelector(selectMe)
  const user = meStateToUser(meUser)
  if (user) return <>{children(user)}</>
  return <LoadingRoute />
}
