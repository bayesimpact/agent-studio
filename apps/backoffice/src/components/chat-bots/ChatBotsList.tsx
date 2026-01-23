"use client"

import type { ChatBotDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { selectChatBots, selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { selectProjects } from "@/features/projects/projects.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { CreateChatBotDialog } from "./CreateChatBotDialog"
import { DeleteChatBotDialog } from "./DeleteChatBotDialog"
import { EditChatBotDialog } from "./EditChatBotDialog"

export function ChatBotsList() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const projects = useAppSelector(selectProjects)
  const chatBots = useAppSelector((state) => (projectId ? selectChatBots(state, projectId) : null))
  const status = useAppSelector(selectChatBotsStatus)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingChatBot, setEditingChatBot] = useState<ChatBotDto | null>(null)
  const [deletingChatBot, setDeletingChatBot] = useState<ChatBotDto | null>(null)

  // Find the project to get its name
  const project = projects?.projects?.find((p) => p.id === projectId)

  // Load chat bots when projectId is available
  useEffect(() => {
    if (projectId) {
      dispatch(listChatBots(projectId))
    }
  }, [projectId, dispatch])

  if (!projectId) {
    return <div>Project not found</div>
  }

  if (!project) {
    return <LoadingRoute />
  }

  const chatBotsList: ChatBotDto[] = chatBots?.chatBots || []
  const isEmpty = chatBotsList.length === 0

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        {!isEmpty && (
          <CreateChatBotDialog
            projectId={projectId}
            projectName={project.name}
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        )}
      </div>

      {status === "loading" && <div>Loading chat bots...</div>}

      {status === "succeeded" && isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle>No chat bots yet</CardTitle>
            <CardDescription>
              Create your first chat bot to get started with custom prompts for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First ChatBot
            </Button>
            <CreateChatBotDialog
              projectId={projectId}
              projectName={project.name}
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          </CardContent>
        </Card>
      )}

      {status === "succeeded" && !isEmpty && (
        <div className="grid gap-4">
          {chatBotsList.map((chatBot) => (
            <Card key={chatBot.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{chatBot.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingChatBot(chatBot)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit ChatBot</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingChatBot(chatBot)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete ChatBot</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {chatBot.defaultPrompt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditChatBotDialog
        chatBot={editingChatBot}
        projectId={projectId}
        onClose={() => setEditingChatBot(null)}
      />

      <DeleteChatBotDialog
        chatBot={deletingChatBot}
        projectId={projectId}
        onClose={() => setDeletingChatBot(null)}
      />
    </div>
  )
}
