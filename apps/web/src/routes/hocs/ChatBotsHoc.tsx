import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsFromProjectId } from "@/features/chat-bots/chat-bots.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ChatBotsHoc({
  projectId,
  children,
}: {
  projectId: string
  children: (chatBots: ChatBot[]) => React.ReactNode
}) {
  const data = useAppSelector(selectChatBotsFromProjectId(projectId))

  if (ADS.isError(data)) return <NotFoundRoute />

  if (ADS.isFulfilled(data) && data.value) return <>{children(data.value)}</>

  return <LoadingRoute />
}
