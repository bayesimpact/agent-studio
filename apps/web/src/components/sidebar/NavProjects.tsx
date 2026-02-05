"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { SidebarMenu } from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsFromProjectId } from "@/features/chat-bots/chat-bots.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { AdminChatBotList, AppChatBotList } from "./projects/chat-bots/ChatBotList"
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog"
import { EditProjectDialog } from "./projects/EditProjectDialog"
import { ProjectOptions } from "./projects/ProjectOptions"
import { NavResources } from "./resources/NavResources"

type Item = { action: "edit" | "delete"; value: ProjectDto }

export function AdminNavProjects({
  organizationId,
  projects,
}: {
  organizationId: string
  projects: ProjectDto[]
}) {
  const [item, setItem] = useState<Item | null>(null)
  const handleItem = (item: Item) => setItem(item)
  const handleClose = () => setItem(null)
  return (
    <>
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          options={
            <ProjectOptions
              onEdit={() => handleItem({ action: "edit", value: project })}
              onDelete={() => handleItem({ action: "delete", value: project })}
            />
          }
          showEmptyProject={true}
        >
          {({ chatBots }) => (
            <AdminChatBotList
              organizationId={organizationId}
              chatBots={chatBots}
              project={project}
            />
          )}
        </ProjectItem>
      ))}

      <EditProjectDialog
        project={item?.action === "edit" ? item.value : null}
        onClose={handleClose}
      />
      <DeleteProjectDialog
        project={item?.action === "delete" ? item.value : null}
        onClose={handleClose}
      />
    </>
  )
}

export function AppNavProjects({
  organizationId,
  projects,
}: {
  organizationId: string
  projects: ProjectDto[]
}) {
  return (
    <>
      {projects.map((project) => (
        <ProjectItem key={project.id} project={project}>
          {({ chatBots }) => (
            <AppChatBotList
              projectId={project.id}
              organizationId={organizationId}
              chatBots={chatBots}
            />
          )}
        </ProjectItem>
      ))}
    </>
  )
}

function ProjectItem({
  project,
  children,
  options,
  showEmptyProject = false,
}: {
  project: ProjectDto
  children: (args: { chatBots: ChatBot[] }) => React.ReactNode
  options?: React.ReactNode
  showEmptyProject?: boolean
}) {
  const { t } = useTranslation("common")
  const chatBots = useAppSelector(selectChatBotsFromProjectId(project.id))
  const name = `${t("project")} - ${project.name}`
  if (!ADS.isFulfilled(chatBots)) return <div>Error</div>
  if (chatBots.value.length === 0 && !showEmptyProject) return null
  return (
    <Section name={name} options={options} className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>{children({ chatBots: chatBots.value })}</SidebarMenu>

      <NavResources organizationId={project.organizationId} projectId={project.id} />
    </Section>
  )
}
