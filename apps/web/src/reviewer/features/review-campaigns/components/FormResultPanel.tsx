import type { ReviewerFormResultDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"

type Props = {
  result: ReviewerFormResultDto
}

type SchemaProperty = {
  title?: string
  description?: string
  type?: string
}

/**
 * Read-only rendering of a form-agent session's collected JSON.
 *
 * Shape of the incoming shapes:
 *  - `schema` is the agent's `outputJsonSchema` — we look at `schema.properties`
 *    to build the ordered list of fields and their labels.
 *  - `value` is the session's `result` (the collected Record) or null if the
 *    user abandoned mid-session.
 */
export function FormResultPanel({ result }: Props) {
  const properties = extractProperties(result.schema)
  const keys = Object.keys(properties)

  if (keys.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">Captured form</h3>
        <p className="text-muted-foreground text-sm italic">
          This form agent has no fields configured on its output schema.
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <header>
        <h3 className="text-sm font-semibold">Captured form</h3>
        {result.value === null && (
          <p className="text-muted-foreground text-xs">
            The tester abandoned before a final value was produced.
          </p>
        )}
      </header>
      <dl className="flex flex-col gap-3">
        {keys.map((key) => {
          const property = properties[key] ?? {}
          const label = property.title ?? key
          const captured = result.value ? result.value[key] : undefined
          return (
            <div key={key} className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                {label}
                {property.type && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {property.type}
                  </Badge>
                )}
              </dt>
              <dd>{renderValue(captured)}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function extractProperties(schema: Record<string, unknown>): Record<string, SchemaProperty> {
  const rawProperties = schema.properties
  if (!rawProperties || typeof rawProperties !== "object") return {}
  const entries = Object.entries(rawProperties as Record<string, unknown>).map(
    ([key, value]): [string, SchemaProperty] => {
      if (!value || typeof value !== "object") return [key, {}]
      const record = value as Record<string, unknown>
      return [
        key,
        {
          title: typeof record.title === "string" ? record.title : undefined,
          description: typeof record.description === "string" ? record.description : undefined,
          type: typeof record.type === "string" ? record.type : undefined,
        },
      ]
    },
  )
  return Object.fromEntries(entries)
}

function renderValue(value: unknown): React.ReactNode {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground text-sm italic">Not collected</span>
  }
  if (Array.isArray(value)) {
    return <span className="font-mono text-sm">{value.join(", ")}</span>
  }
  if (typeof value === "object") {
    return <span className="font-mono text-sm">{JSON.stringify(value)}</span>
  }
  return <span className="font-mono text-sm">{String(value)}</span>
}
