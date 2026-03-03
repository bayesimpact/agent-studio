import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Project } from "@/features/projects/projects.models"
import { AgentCreator } from "./AgentCreator"

export function EmptyAgent({ project }: { project: Project }) {
  const { t } = useTranslation("agent", { keyPrefix: "list" })
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("empty.title")}</CardTitle>
          <CardDescription>{t("empty.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentCreatorButton project={project} />
        </CardContent>
      </Card>
    </div>
  )
}

function AgentCreatorButton({ project }: { project: Project }) {
  const { t } = useTranslation("agent", { keyPrefix: "list" })
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 size-4" />
        {t("empty.button")}
      </Button>
      <AgentCreator project={project} open={open} onOpenChange={setOpen} />
    </>
  )
}
