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
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { buildChatBotPath } from "@/routes/helpers"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { CreateChatBotDialog } from "./CreateChatBotDialog"
import { DeleteChatBotDialogWithOutTrigger } from "./DeleteChatBotDialog"
import { EditChatBotDialogWithOutTrigger } from "./EditChatBotDialog"

export function AdminChatBotsList({
  project,
  chatBots,
}: {
  project: ProjectDto
  chatBots: ChatBot[]
}) {
  const { t } = useTranslation("chatBot", { keyPrefix: "list" })
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
        admin: true,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="scroll-m-20 text-xl font-semibold tracking-tight">{t("title")}</h1>
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

      {ADS.isLoading(status) && <LoadingRoute />}

      {ADS.isFulfilled(status) && isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle>{t("empty.title")}</CardTitle>
            <CardDescription>{t("empty.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("empty.button")}
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

      {ADS.isFulfilled(status) && !isEmpty && (
        <div className="grid gap-4">
          {chatBots.map((chatBot) => (
            <Card key={chatBot.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="cursor-pointer hover:underline"
                    onClick={() => handleClick(chatBot.id)}
                  >
                    {chatBot.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t("actions.more")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingChatBot(chatBot)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>{t("actions.edit")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingChatBot(chatBot)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t("actions.delete")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <EditChatBotDialogWithOutTrigger
        chatBot={editingChatBot}
        onClose={() => setEditingChatBot(null)}
      />

      <DeleteChatBotDialogWithOutTrigger
        chatBot={deletingChatBot}
        onClose={() => setDeletingChatBot(null)}
      />
    </div>
  )
}

export function AppChatBotsList({
  project,
  chatBots,
}: {
  project: ProjectDto
  chatBots: ChatBot[]
}) {
  const { t } = useTranslation("chatBot", { keyPrefix: "list" })
  const navigate = useNavigate()
  const status = useAppSelector(selectChatBotsStatus)

  const [_isCreateDialogOpen, _setIsCreateDialogOpen] = useState(false)
  const [_editingChatBot, _setEditingChatBot] = useState<ChatBot | null>(null)
  const [_deletingChatBot, _setDeletingChatBot] = useState<ChatBot | null>(null)

  const isEmpty = chatBots.length === 0

  const handleClick = (chatBotId: string) => {
    navigate(
      buildChatBotPath({
        organizationId: project.organizationId,
        projectId: project.id,
        chatBotId,
        admin: false,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="scroll-m-20 text-xl font-semibold tracking-tight">{t("title")}</h1>

      {ADS.isLoading(status) && <LoadingRoute />}

      {ADS.isFulfilled(status) && isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle>{t("empty.title")}</CardTitle>
          </CardHeader>
        </Card>
      )}

      {ADS.isFulfilled(status) && !isEmpty && (
        <div className="grid gap-4">
          {chatBots.map((chatBot) => (
            <Card key={chatBot.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="cursor-pointer hover:underline"
                    onClick={() => handleClick(chatBot.id)}
                  >
                    {chatBot.name}
                  </CardTitle>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
