import type { User } from "@/features/me/me.models"
import { selectMeData } from "@/features/me/me.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function UserHoc({ children }: { children: (user: User) => React.ReactNode }) {
  const { admin } = useAbility()
  const meData = useAppSelector(selectMeData)

  if (ADS.isError(meData)) return <NotFoundRoute />

  if (ADS.isFulfilled(meData))
    return (
      <>
        {children({
          ...meData.value,
          admin,
        })}
      </>
    )

  return <LoadingRoute />
}
