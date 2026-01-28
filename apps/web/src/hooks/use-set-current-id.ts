import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { chatBotsActions } from "@/features/chat-bots/chat-bots.slice"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import { projectsActions } from "@/features/projects/projects.slice"
import type { AppDispatch } from "@/store"
import { useAppDispatch } from "@/store/hooks"

export function useSetCurrentOrganizationId() {
  const { organizationId } = useParams()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!organizationId) return
    dispatch(organizationsActions.setCurrentOrganizationId({ organizationId }))
    return () => {
      dispatch(organizationsActions.setCurrentOrganizationId({ organizationId: null }))
    }
  }, [dispatch, organizationId])
}

export function useSetCurrentProjectId({
  projectId,
  dispatch,
}: {
  projectId?: string
  dispatch: AppDispatch
}) {
  useEffect(() => {
    if (!projectId) return
    dispatch(projectsActions.setCurrentProjectId({ projectId }))
    return () => {
      dispatch(projectsActions.setCurrentProjectId({ projectId: null }))
    }
  }, [dispatch, projectId])
}

export function useSetCurrentChatBotId() {
  const { chatBotId } = useParams()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!chatBotId) return
    dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId }))
    return () => {
      dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId: null }))
    }
  }, [dispatch, chatBotId])
}
