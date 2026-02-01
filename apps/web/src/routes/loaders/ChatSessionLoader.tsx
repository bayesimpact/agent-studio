import {
  selectChatSessionStatus,
  selectCurrentChatSessionId,
} from "@/features/chat-sessions/chat-sessions.selectors"
import { useSetCurrentChatSessionId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatSessionLoader({ children }: { children: React.ReactNode }) {
  useSetCurrentChatSessionId()

  const chatSessionId = useAppSelector(selectCurrentChatSessionId)
  const status = useAppSelector(selectChatSessionStatus)

  // FIXME: should be triggered elsewhere by a button
  // useEffect(() => {
  //   if (admin) void dispatch(createPlaygroundSession())
  //   else void dispatch(createAppSession())
  // }, [dispatch, admin])

  if (ADS.isError(status)) return <NotFoundRoute />

  if (ADS.isFulfilled(status) && chatSessionId) return <>{children}</>

  return <LoadingRoute />
}
