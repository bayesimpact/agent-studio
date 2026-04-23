import { selectIsBackofficeAuthorized, selectMeStatus } from "@/common/features/me/me.selectors"
import { ErrorRoute } from "@/common/routes/ErrorRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { useInitStore } from "../hooks/use-init-store"

export function BackofficeGuard({ children }: { children: React.ReactNode }) {
  const meStatus = useAppSelector(selectMeStatus)
  const isBackofficeAuthorized = useAppSelector(selectIsBackofficeAuthorized)

  const { initDone } = useInitStore(isBackofficeAuthorized)
  if (ADS.isLoading(meStatus) || ADS.isUninitialized(meStatus) || !initDone) {
    return <LoadingRoute />
  }

  if (!isBackofficeAuthorized) {
    return <ErrorRoute error="You are not authorized to access the backoffice." />
  }
  return <>{children}</>
}
