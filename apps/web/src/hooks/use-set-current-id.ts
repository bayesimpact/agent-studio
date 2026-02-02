import { useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { chatBotsActions } from "@/features/chat-bots/chat-bots.slice"
import { chatSessionsActions } from "@/features/chat-sessions/chat-sessions.slice"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import { projectsActions } from "@/features/projects/projects.slice"
import { useAppDispatch } from "@/store/hooks"

export function useSetCurrentOrganizationId() {
  const { organizationId } = useParams()
  const ref = useRef<string | null>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (organizationId) {
      if (organizationId === ref.current) return

      ref.current = organizationId
      dispatch(organizationsActions.setCurrentOrganizationId({ organizationId }))
    } else dispatch(organizationsActions.setCurrentOrganizationId({ organizationId: null }))
    return () => {
      dispatch(organizationsActions.setCurrentOrganizationId({ organizationId: null }))
    }
  }, [dispatch, organizationId])
}

export function useSetCurrentProjectId() {
  const { projectId } = useParams()
  const ref = useRef<string | null>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (projectId) {
      if (projectId === ref.current) return

      ref.current = projectId
      dispatch(projectsActions.setCurrentProjectId({ projectId }))
    } else dispatch(projectsActions.setCurrentProjectId({ projectId: null }))
    return () => {
      dispatch(projectsActions.setCurrentProjectId({ projectId: null }))
    }
  }, [dispatch, projectId])
}

export function useSetCurrentChatBotId() {
  const { chatBotId } = useParams()
  const ref = useRef<string | null>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (chatBotId) {
      if (chatBotId === ref.current) return

      ref.current = chatBotId
      dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId }))
    } else dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId: null }))
    return () => {
      dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId: null }))
    }
  }, [dispatch, chatBotId])
}

export function useSetCurrentChatSessionId() {
  const { chatSessionId } = useParams()
  const ref = useRef<string | null>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (chatSessionId) {
      if (chatSessionId === ref.current) return

      ref.current = chatSessionId
      dispatch(chatSessionsActions.setCurrentChatSessionId({ chatSessionId }))
    } else dispatch(chatSessionsActions.setCurrentChatSessionId({ chatSessionId: null }))
    return () => {
      dispatch(chatSessionsActions.setCurrentChatSessionId({ chatSessionId: null }))
    }
  }, [dispatch, chatSessionId])
}
