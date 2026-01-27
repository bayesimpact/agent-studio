"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
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
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { buildChatBotPath } from "@/routes/helpers"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"
import { CreateChatBotDialog } from "./CreateChatBotDialog"
import { DeleteChatBotDialog } from "./DeleteChatBotDialog"
import { EditChatBotDialog } from "./EditChatBotDialog"

export function ChatBotsList({ project, chatBots }: { project: ProjectDto; chatBots: ChatBot[] }) {
  const navigate = useNavigate()
  const status = useAppSelector(selectChatBotsStatus)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingChatBot, setEditingChatBot] = useState<ChatBot | null>(null)
  const [deletingChatBot, setDeletingChatBot] = useState<ChatBot | null>(null)

  const isEmpty = chatBots.length === 0

  const handleClick = (chatBotId: string) => {
    navigate(
      buildChatBotPath({
        organizationId: project.organizationId,
        projectId: project.id,
        chatBotId,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="scroll-m-20 text-xl font-semibold tracking-tight">Chat Bots</h1>
      <div className="flex items-center justify-between">
        {!isEmpty && (
          <CreateChatBotDialog
            projectId={project.id}
            projectName={project.name}
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        )}
      </div>

      {status === "loading" && <LoadingRoute />}

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
              projectId={project.id}
              projectName={project.name}
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          </CardContent>
        </Card>
      )}

      {status === "succeeded" && !isEmpty && (
        <div className="grid gap-4">
          {chatBots.map((chatBot) => (
            <Card key={chatBot.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="cursor-pointer" onClick={() => handleClick(chatBot.id)}>
                    {chatBot.name}
                  </CardTitle>
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

      <EditChatBotDialog chatBot={editingChatBot} onClose={() => setEditingChatBot(null)} />

      <DeleteChatBotDialog chatBot={deletingChatBot} onClose={() => setDeletingChatBot(null)} />
    </div>
  )
}
