import { Badge } from "@caseai-connect/ui/shad/badge"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Separator } from "@caseai-connect/ui/shad/separator"
import { useTranslation } from "react-i18next"
import type { FormAgentSession } from "@/features/agents/agent-sessions/form/form-agent-sessions.models"
import type { Agent } from "@/features/agents/agents.models"

export function FormResult({
  agent,
  agentSession,
}: {
  agent: Agent
  agentSession: FormAgentSession
}) {
  const { t } = useTranslation()
  const form = buildForm({ agent, agentSession })
  return (
    <Item>
      <ItemHeader>
        <ItemTitle className="text-lg">{t("formAgentSession:props.result")}</ItemTitle>
      </ItemHeader>
      <ItemContent>
        {Object.entries(form).map(([key, value], index) => {
          const hasValue = value !== ""
          return (
            <div key={key}>
              {index > 0 && <Separator className="opacity-50" />}
              <div className="flex gap-2 py-4 items-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {key}
                </span>
                {hasValue ? (
                  <Badge variant="outline" className="w-fit text-muted-foreground font-mono">
                    {value}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="w-fit text-muted-foreground opacity-50 font-mono"
                  >
                    —
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </ItemContent>
    </Item>
  )
}

function buildForm({ agent, agentSession }: { agent: Agent; agentSession: FormAgentSession }) {
  const properties = Object.fromEntries(
    Object.entries(agent.outputJsonSchema?.properties ?? {}).map(([key]) => [key, ""]),
  )
  if (agentSession.result) {
    for (const key of Object.keys(properties)) {
      if (key in agentSession.result) {
        properties[key] = String(agentSession.result[key])
      }
    }
  }
  return properties
}
