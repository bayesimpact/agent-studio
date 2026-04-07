import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@caseai-connect/ui/shad/breadcrumb"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { cn } from "@caseai-connect/ui/utils"
import { CheckIcon, ChevronDownIcon, DotIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { useBuildDeskPath } from "@/desk/hooks/use-desk-build-path"
import { selectAgentsData, selectCurrentAgentData } from "@/features/agents/agents.selectors"
import { useBuildStudioPath } from "@/studio/hooks/use-studio-build-path"
import { isStudioInterface } from "@/studio/routes/helpers"

export function BreadcrumbAgent({ organizationId }: { organizationId: string }) {
  const agents = useAppSelector(selectAgentsData)
  const agent = useAppSelector(selectCurrentAgentData)
  const { buildStudioPath } = useBuildStudioPath()
  const { buildDeskPath } = useBuildDeskPath()
  if (!ADS.isFulfilled(agents) || !ADS.isFulfilled(agent)) return null

  const buildPath = isStudioInterface() ? buildStudioPath : buildDeskPath

  const currentAgentPath = buildPath("agent", {
    organizationId,
    projectId: agent.value.projectId,
    agentId: agent.value.id,
  })

  const handleClick = (agentId: string) => () => {
    const nextAgent = agents.value.find((candidateAgent) => candidateAgent.id === agentId)
    if (!nextAgent) return
    const path = buildPath("agent", { organizationId, projectId: agent.value.projectId, agentId })
    window.location.replace(path)
  }

  if (agents.value.length === 1)
    return (
      <>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={currentAgentPath}>{agent.value.name}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </>
    )
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {agent.value.name}
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {agents.value.map((a) => (
              <DropdownMenuItem
                key={a.id}
                className={cn("justify-between", a.id === agent.value.id && "font-semibold")}
                onClick={handleClick(a.id)}
              >
                {a.name} {a.id === agent.value.id && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
