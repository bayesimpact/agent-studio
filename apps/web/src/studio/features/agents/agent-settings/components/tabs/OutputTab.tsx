import { updateAgentSettingsOutputSchema } from "@caseai-connect/api-contracts"
import { Field } from "@caseai-connect/ui/shad/field"
import { Form, FormField } from "@caseai-connect/ui/shad/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { updateAgentSettingsOutput } from "@/common/features/agents/agent-settings/agent-settings.thunks"
import { useAppDispatch } from "@/common/store/hooks"
import { type AgentTabFormProps, useReportDirty } from "../agent-tab-form.shared"
import { OutputSchemaField } from "../OutputSchemaField"
import { TabSaveButton } from "./TabSaveButton"

type FormValues = z.infer<typeof updateAgentSettingsOutputSchema>

export function OutputTab({ agentSettings, onDirtyChange }: AgentTabFormProps) {
  const dispatch = useAppDispatch()

  const form = useForm<FormValues>({
    resolver: zodResolver(updateAgentSettingsOutputSchema),
    defaultValues: { outputJsonSchema: agentSettings.outputJsonSchema ?? {} },
  })
  useReportDirty(form.formState.isDirty, onDirtyChange)

  // Remount key for the schema editor: bumping it re-seeds the builder/textarea
  // from the form value (used on cancel, since both hold their own editing state).
  const [editorVersion, setEditorVersion] = useState(0)

  const handleSubmit = form.handleSubmit(async (values) => {
    await dispatch(
      updateAgentSettingsOutput({ agentId: agentSettings.agentId, fields: values }),
    ).unwrap()
    form.reset(values)
  })

  const handleCancel = () => {
    form.reset()
    setEditorVersion((previous) => previous + 1)
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="outputJsonSchema"
          render={({ field }) => (
            <Field>
              <OutputSchemaField
                key={editorVersion}
                value={field.value}
                onChange={(schema) => field.onChange(schema)}
                allowOrdering={false}
              />
            </Field>
          )}
        />

        <TabSaveButton
          isSubmitting={form.formState.isSubmitting}
          isDirty={form.formState.isDirty}
          onCancel={handleCancel}
        />
      </form>
    </Form>
  )
}
