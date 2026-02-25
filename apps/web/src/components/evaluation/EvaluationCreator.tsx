import { Button } from "@caseai-connect/ui/shad/button"
import { Dialog, DialogContent, DialogTrigger } from "@caseai-connect/ui/shad/dialog"
import { Label } from "@caseai-connect/ui/shad/label"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { PenLineIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import type { Evaluation } from "@/features/evaluations/evaluations.models"
import { updateEvaluation } from "@/features/evaluations/evaluations.thunks"
import { useAppDispatch } from "@/store/hooks"

type EvaluationFormData = {
  input: string
  expectedOutput: string
}

export function EvaluationCreator({ onSubmit }: { onSubmit: (data: EvaluationFormData) => void }) {
  const { t } = useTranslation("evaluation")
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("addEvaluation")}</Button>
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
  const { t } = useTranslation("evaluation", { keyPrefix: "form" })
  const { t: tCommon } = useTranslation("common")

  const evaluationSchema = z.object({
    input: z.string().min(1, t("validation.inputRequired")),
    expectedOutput: z.string().min(1, t("validation.expectedOutputRequired")),
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
      <div className="space-y-2">
        <Label htmlFor="input">{t("labelInput")}</Label>
        <Textarea id="input" {...register("input")} placeholder={t("placeholderInput")} />
        {errors.input && <p className="text-sm text-destructive">{errors.input.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedOutput">{t("labelExpectedOutput")}</Label>
        <Textarea
          id="expectedOutput"
          {...register("expectedOutput")}
          placeholder={t("placeholderExpectedOutput")}
        />
        {errors.expectedOutput && (
          <p className="text-sm text-destructive">{errors.expectedOutput.message}</p>
        )}
      </div>

      <Button type="submit">
        {tCommon(editableEvaluation ? "update" : "create", { cfl: true })}
      </Button>
    </form>
  )
}
