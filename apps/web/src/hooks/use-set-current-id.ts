import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { chatBotsActions } from "@/features/chat-bots/chat-bots.slice"
import { chatSessionsActions } from "@/features/chat-sessions/chat-sessions.slice"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import { projectsActions } from "@/features/projects/projects.slice"
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

export function useSetCurrentProjectId() {
  const { projectId } = useParams()
  const dispatch = useAppDispatch()

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

export function useSetCurrentChatSessionId() {
  const { chatSessionId } = useParams()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!chatSessionId) return
    dispatch(chatSessionsActions.setCurrentChatSessionId({ chatSessionId }))
    return () => {
      dispatch(chatSessionsActions.setCurrentChatSessionId({ chatSessionId: null }))
    }
  }, [dispatch, chatSessionId])
}
