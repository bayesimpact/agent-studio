import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { selectMe, selectMeStatus } from "@/features/me/me.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { meStateToUser } from "@/utils/to-user"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function UserHoc({ children }: { children: (user: User) => React.ReactNode }) {
  const me = useAppSelector(selectMe)
  const status = useAppSelector(selectMeStatus)
  const user = meStateToUser(me)

  if (ADS.isError(status)) return <NotFoundRoute />

  if (user && ADS.isFulfilled(status)) return <>{children(user)}</>

  return <LoadingRoute />
}
