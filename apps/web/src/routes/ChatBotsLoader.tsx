import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { selectProjectsStatus } from "@/features/projects/projects.selectors"
import { useSetCurrentProjectId } from "@/hooks/use-set-current-id"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ChatBotsLoader({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams()
  const dispatch = useAppDispatch()

  useSetCurrentProjectId({ projectId, dispatch })

  const status = useAppSelector(selectProjectsStatus)

  useEffect(() => {
    if (!projectId) return
    dispatch(listChatBots({ projectId }))
  }, [dispatch, projectId])

  if (status === "failed") return <NotFoundRoute />

  if (status === "succeeded") return <>{children}</>

  return <LoadingRoute />
}
