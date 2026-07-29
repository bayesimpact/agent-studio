import { agentPublishSchema } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@caseai-connect/ui/shad/form"
import { Input } from "@caseai-connect/ui/shad/input"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckSquareIcon, UploadIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { z } from "zod"
import type { Agent } from "@/common/features/agents/agents.models"
import { useAppDispatch } from "@/common/store/hooks"
import { publishAgentRevision } from "../agent-history.thunks"

/**
 * Publishes the agent's draft revision. Saving any tab creates or updates a draft revision;
 * publishing freezes it and makes it the settings the agent actually runs with. Disabled while
 * there is no draft to publish.
 */
export function AgentPublishButton({
  agent,
  size,
}: {
  agent: Agent
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size={size}
          disabled={!agent.isDraft}
          title={agent.isDraft ? undefined : t("agent:publish.noDraft")}
        >
          <CheckSquareIcon className="size-4" />
          {t("agent:publish.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <PublishForm agent={agent} onPublished={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

type FormValues = z.infer<typeof agentPublishSchema>

function PublishForm({ agent, onPublished }: { agent: Agent; onPublished: () => void }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const form = useForm<FormValues>({
    resolver: zodResolver(agentPublishSchema),
    defaultValues: {
      revisionName: agent.revisionName ?? "",
      revisionDesc: agent.revisionDesc ?? "",
    },
  })

  const handleFormSubmit = async (values: FormValues) => {
    try {
      await dispatch(
        publishAgentRevision({
          revision: agent.revision,
          // Both fields are optional: send undefined rather than an empty string so the
          // published version keeps no name/description at all.
          revisionName: values.revisionName?.trim() || undefined,
          revisionDesc: values.revisionDesc?.trim() || undefined,
        }),
      ).unwrap()
      onPublished()
    } catch {
      // The studio agents middleware shows the error notification.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <DialogHeader>
          <DialogTitle>{t("agent:publish.dialog.title", { revision: agent.revision })}</DialogTitle>
          <DialogDescription>
            {t("agent:publish.dialog.description", { revision: agent.revision })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <FormField
            control={form.control}
            name="revisionName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("agent:publish.props.revisionName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("agent:publish.props.placeholders.revisionName")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("agent:publish.optional")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="revisionDesc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("agent:publish.props.revisionDesc")}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder={t("agent:publish.props.placeholders.revisionDesc")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("agent:publish.optional")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <UploadIcon className="size-4" />
            {t("agent:publish.dialog.submit")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
