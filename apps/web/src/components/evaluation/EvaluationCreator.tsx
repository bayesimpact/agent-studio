import { Button } from "@caseai-connect/ui/shad/button"
import { Dialog, DialogContent, DialogTrigger } from "@caseai-connect/ui/shad/dialog"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@caseai-connect/ui/shad/field"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { PenLineIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useAppDispatch } from "@/store/hooks"
import type { Evaluation } from "@/studio/features/evaluations/evaluations.models"
import { updateEvaluation } from "@/studio/features/evaluations/evaluations.thunks"

type EvaluationFormData = {
  input: string
  expectedOutput: string
}

export function EvaluationCreator({ onSubmit }: { onSubmit: (data: EvaluationFormData) => void }) {
  const { t } = useTranslation("evaluation", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("button")}</Button>
      </DialogTrigger>
      <DialogContent>
        <EvaluationForm
          onSubmit={(data) => {
            onSubmit(data)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export function EvaluationEditor({ evaluation }: { evaluation: Evaluation }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const handleSubmit = (fields: EvaluationFormData) => {
    dispatch(updateEvaluation({ evaluationId: evaluation.id, fields }))
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PenLineIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <EvaluationForm editableEvaluation={evaluation} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}

function EvaluationForm({
  onSubmit,
  editableEvaluation,
}: {
  onSubmit: (data: EvaluationFormData) => void
  editableEvaluation?: Evaluation
}) {
  const { t } = useTranslation()

  const evaluationSchema = z.object({
    input: z.string().min(1, t("evaluation:props.validation.inputRequired")),
    expectedOutput: z.string().min(1, t("evaluation:props.validation.expectedOutputRequired")),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      input: editableEvaluation?.input || "",
      expectedOutput: editableEvaluation?.expectedOutput || "",
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        // Reset the form after submission only if it's not an editable evaluation
        if (!editableEvaluation) {
          setValue("input", "")
          setValue("expectedOutput", "")
        }
        onSubmit(data)
      })}
      className="space-y-4 flex-1"
    >
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel htmlFor="input">{t("evaluation:props.input")}</FieldLabel>
            <Textarea
              id="input"
              {...register("input")}
              placeholder={t("evaluation:props.placeholders.input")}
            />
            {errors.input && <p className="text-sm text-destructive">{errors.input.message}</p>}
          </Field>

          <Field>
            <FieldLabel htmlFor="expectedOutput">{t("evaluation:props.expectedOutput")}</FieldLabel>
            <Textarea
              id="expectedOutput"
              {...register("expectedOutput")}
              placeholder={t("evaluation:props.placeholders.expectedOutput")}
            />
            {errors.expectedOutput && (
              <p className="text-sm text-destructive">{errors.expectedOutput.message}</p>
            )}
          </Field>

          <Field orientation="horizontal" className="justify-end">
            <Button type="submit">
              {t(editableEvaluation ? "actions:update" : "actions:create")}
            </Button>
          </Field>
        </FieldSet>
      </FieldGroup>
    </form>
  )
}
