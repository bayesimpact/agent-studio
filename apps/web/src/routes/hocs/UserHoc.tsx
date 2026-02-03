import type { User } from "@/features/me/me.models"
import { selectMeData } from "@/features/me/me.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function UserHoc({ children }: { children: (user: User) => React.ReactNode }) {
  const data = useAppSelector(selectMeData)

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data)) return <>{children(data.value)}</>

  return <LoadingRoute />
}
