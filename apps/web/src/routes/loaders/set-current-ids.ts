import { useEffect } from "react"
import type { Params } from "react-router-dom"
import { chatBotsActions } from "@/features/chat-bots/chat-bots.slice"
import { chatSessionsActions } from "@/features/chat-sessions/chat-sessions.slice"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import { projectsActions } from "@/features/projects/projects.slice"
import type { AppDispatch } from "@/store"

export const setCurrentIds = ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}) => {
  const { organizationId, projectId, chatBotId, chatSessionId } = params

  useEffect(() => {
    dispatch(
      organizationsActions.setCurrentOrganizationId({ organizationId: organizationId || null }),
    )

    dispatch(projectsActions.setCurrentProjectId({ projectId: projectId || null }))

    dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId: chatBotId || null }))

    dispatch(chatSessionsActions.setCurrentChatSessionId({ chatSessionId: chatSessionId || null }))
  }, [dispatch, organizationId, projectId, chatBotId, chatSessionId])
}
