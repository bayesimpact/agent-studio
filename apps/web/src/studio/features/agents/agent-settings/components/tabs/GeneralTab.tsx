import { AgentLocale, updateAgentSettingsGeneralSchema } from "@caseai-connect/api-contracts"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@caseai-connect/ui/shad/form"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { z } from "zod"
import { updateAgentSettingsGeneral } from "@/common/features/agents/agent-settings/agent-settings.thunks"
import type { Agent } from "@/common/features/agents/agents.models"
import { useAppDispatch } from "@/common/store/hooks"
import { type AgentTabFormProps, pickDirtyFields, useReportDirty } from "../agent-tab-form.shared"
import { TabSaveButton } from "./TabSaveButton"

type FormValues = z.infer<typeof updateAgentSettingsGeneralSchema>

export function GeneralTab({
  agent,
  agentSettings,
  onDirtyChange,
}: AgentTabFormProps & {
  agent: Agent
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const hasGreetingMessage = agent.type === "conversation"

  const form = useForm<FormValues>({
    resolver: zodResolver(updateAgentSettingsGeneralSchema),
    defaultValues: {
      name: agent.name,
      locale: agentSettings.locale,
      instructions: agentSettings.instructions,
      greetingMessage: agentSettings.greetingMessage ?? null,
    },
  })
  useReportDirty(form.formState.isDirty, onDirtyChange)

  const handleSubmit = form.handleSubmit(async (values) => {
    const fields = pickDirtyFields(values, form.formState.dirtyFields)
    await dispatch(updateAgentSettingsGeneral({ agentId: agent.id, fields })).unwrap()
    form.reset(values)
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("agent:props.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("agent:props.placeholders.name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("agentSettings:props.locale")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("agentSettings:props.placeholders.locale")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(AgentLocale).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {hasGreetingMessage && (
          <FormField
            control={form.control}
            name="greetingMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("agentSettings:props.greeting")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("agentSettings:props.placeholders.greeting")}
                    rows={3}
                    className="min-h-40 max-h-96 font-mono"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(event.target.value === "" ? null : event.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("agentSettings:props.instructions")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("agentSettings:props.placeholders.instructions")}
                  rows={8}
                  className="min-h-40 max-h-96 font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <TabSaveButton
          isSubmitting={form.formState.isSubmitting}
          isDirty={form.formState.isDirty}
          onCancel={() => form.reset()}
        />
      </form>
    </Form>
  )
}
