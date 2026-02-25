"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsStatus } from "@/features/agents/agents.selectors"
import { deleteAgent } from "@/features/agents/agents.thunks"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function DeleteAgentDialogWithTrigger({
  organizationId,
  agent,
}: {
  organizationId: string
  agent: Agent
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { buildPath } = useBuildPath()
  const path = buildPath("project", { organizationId, projectId: agent.projectId })

  const handleSuccess = () => {
    navigate(path, { replace: true })
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <Content agent={agent} onSuccess={handleSuccess} onClose={handleClose} />
    </Dialog>
  )
}

export function DeleteAgentDialogWithOutTrigger({
  organizationId,
  projectId,
  agent,
  onClose,
}: {
  organizationId: string
  projectId: string
  agent: Agent | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const path = buildPath("project", { organizationId, projectId })
  const handleSuccess = () => {
    navigate(path, { replace: true })
    onClose()
  }

  if (!agent) return null

  return (
    <Dialog open={!!agent} onOpenChange={(open: boolean) => !open && onClose()}>
      <Content agent={agent} onSuccess={handleSuccess} onClose={onClose} />
    </Dialog>
  )
}

function Content({
  agent,
  onSuccess,
  onClose,
}: {
  agent: Agent
  onSuccess: () => void
  onClose: () => void
}) {
  const { t } = useTranslation("agent", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const status = useAppSelector(selectAgentsStatus)

  const handleDelete = () => {
    dispatch(
      deleteAgent({
        organizationId: organizationId!,
        projectId: agent.projectId,
        agentId: agent.id,
        onSuccess,
      }),
    )
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description", { name: agent.name })}</DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose} disabled={ADS.isLoading(status)}>
          {tCommon("cancel", { cfl: true })}
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={ADS.isLoading(status)}>
          {ADS.isLoading(status) ? t("submitting") : t("submit")}
        </Button>
      </div>
    </DialogContent>
  )
}
