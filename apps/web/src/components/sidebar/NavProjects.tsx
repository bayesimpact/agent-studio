"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { SidebarMenu } from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBots } from "@/features/chat-bots/chat-bots.selectors"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { useAppSelector } from "@/store/hooks"
import { AdminChatBotList, AppChatBotList } from "./projects/chat-bots/ChatBotList"
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog"
import { EditProjectDialog } from "./projects/EditProjectDialog"
import { ProjectOptions } from "./projects/ProjectOptions"

type Item = { action: "edit" | "delete"; value: ProjectDto }

export function AdminNavProjects({ projects }: { projects: ProjectDto[] }) {
  const currentOrganization = useAppSelector(selectCurrentOrganization)
  const [item, setItem] = useState<Item | null>(null)
  const handleItem = (item: Item) => setItem(item)
  const handleClose = () => setItem(null)
  if (!currentOrganization) return null
  return (
    <>
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          currentOrganizationId={currentOrganization.id}
          options={
            <ProjectOptions
              onEdit={() => handleItem({ action: "edit", value: project })}
              onDelete={() => handleItem({ action: "delete", value: project })}
            />
          }
          showEmptyProject={true}
        >
          {({ chatBots, organizationId }) => (
            <AdminChatBotList chatBots={chatBots} organizationId={organizationId} />
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

export function AppNavProjects({ projects }: { projects: ProjectDto[] }) {
  const currentOrganization = useAppSelector(selectCurrentOrganization)
  if (!currentOrganization) return null
  return (
    <>
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          currentOrganizationId={currentOrganization.id}
        >
          {({ chatBots, organizationId }) => (
            <AppChatBotList chatBots={chatBots} organizationId={organizationId} />
          )}
        </ProjectItem>
      ))}
    </>
  )
}

function ProjectItem({
  project,
  currentOrganizationId,
  children,
  options,
  showEmptyProject = false,
}: {
  project: ProjectDto
  currentOrganizationId: string
  children: (args: { chatBots: ChatBot[]; organizationId: string }) => React.ReactNode
  options?: React.ReactNode
  showEmptyProject?: boolean
}) {
  const { t } = useTranslation("common")
  const chatBots = useAppSelector(selectChatBots(project.id)) || []
  const name = `${t("project")} - ${project.name}`
  if (chatBots.length === 0 && !showEmptyProject) return null
  return (
    <Section name={name} options={options} className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>{children({ chatBots, organizationId: currentOrganizationId })}</SidebarMenu>
    </Section>
  )
}
