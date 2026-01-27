"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { SidebarMenu } from "@caseai-connect/ui/shad/sidebar"
import { useState } from "react"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { useAppSelector } from "@/store/hooks"
import { DeleteChatBotDialog } from "../chat-bots/DeleteChatBotDialog"
import { EditChatBotDialog } from "../chat-bots/EditChatBotDialog"
import { CreateProjectButton } from "./projects/CreateProjectButton"
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog"
import { EditProjectDialog } from "./projects/EditProjectDialog"
import { ProjectListItem } from "./projects/ProjectListItem"

type Item = { action: "edit" | "delete" } & (
  | {
      type: "project"
      value: ProjectDto
    }
  | {
      type: "chatBot"
      value: ChatBot
    }
)

export function NavProjects({
  projects,
  organizationId,
}: {
  projects: ProjectDto[]
  organizationId: string
}) {
  const currentOrganization = useAppSelector(selectCurrentOrganization(organizationId))
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [item, setItem] = useState<Item | null>(null)

  if (!currentOrganization) {
    return null
  }

  const handleItem = (item: Item) => {
    setItem(item)
  }

  const handleClose = () => setItem(null)

  return (
    <Section name="Projects" className="group-data-[collapsible=icon]:hidden">
      {projects.length === 0 ? (
        <CreateProjectButton
          organizationId={currentOrganization.id}
          organizationName={currentOrganization.name}
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      ) : (
        <>
          <SidebarMenu>
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                organizationId={currentOrganization.id}
                onEditItem={(item) =>
                  handleItem({
                    action: "edit",
                    ...item,
                  })
                }
                onDeleteItem={(item) =>
                  handleItem({
                    action: "delete",
                    ...item,
                  })
                }
              />
            ))}
          </SidebarMenu>

          <CreateProjectButton
            organizationId={currentOrganization.id}
            organizationName={currentOrganization.name}
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        </>
      )}

      <EditProjectDialog
        project={item?.type === "project" && item.action === "edit" ? item.value : null}
        organizationId={currentOrganization.id}
        onClose={handleClose}
      />
      <DeleteProjectDialog
        project={item?.type === "project" && item.action === "delete" ? item.value : null}
        organizationId={currentOrganization.id}
        onClose={handleClose}
      />

      <EditChatBotDialog
        chatBot={item?.type === "chatBot" && item.action === "edit" ? item.value : null}
        onClose={handleClose}
      />
      <DeleteChatBotDialog
        chatBot={item?.type === "chatBot" && item.action === "delete" ? item.value : null}
        onClose={handleClose}
      />
    </Section>
  )
}
