import { Button } from "@caseai-connect/ui/shad/button"
import { Dialog, DialogContent, DialogTrigger } from "@caseai-connect/ui/shad/dialog"
import { Label } from "@caseai-connect/ui/shad/label"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

export type EvaluationFormData = {
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

function EvaluationForm({ onSubmit }: { onSubmit: (data: EvaluationFormData) => void }) {
  const { t } = useTranslation("evaluation", { keyPrefix: "form" })

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
      input: "",
      expectedOutput: "",
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        // Reset the form after submission
        setValue("input", "")
        setValue("expectedOutput", "")
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

      <Button type="submit">{t("submit")}</Button>
    </form>
  )
}
