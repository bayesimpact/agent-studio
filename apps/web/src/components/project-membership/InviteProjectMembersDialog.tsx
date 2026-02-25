import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
import { PlusIcon, XIcon } from "lucide-react"
import { type KeyboardEvent, useState } from "react"
import { useTranslation } from "react-i18next"
import { inviteProjectMembers } from "@/features/project-memberships/project-memberships.thunks"
import { useAppDispatch } from "@/store/hooks"

export function InviteProjectMembersDialog({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("projectMemberships", { keyPrefix: "invite" })
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddEmail = () => {
    const trimmedEmail = inputValue.trim().toLowerCase()
    if (trimmedEmail && !emails.includes(trimmedEmail) && isValidEmail(trimmedEmail)) {
      setEmails([...emails, trimmedEmail])
      setInputValue("")
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleAddEmail()
    }
  }

  const handleSubmit = async () => {
    if (emails.length === 0) return
    setIsSubmitting(true)
    try {
      await dispatch(
        inviteProjectMembers({
          organizationId,
          projectId,
          payload: { emails },
        }),
      ).unwrap()
      setOpen(false)
      setEmails([])
      setInputValue("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setEmails([])
      setInputValue("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-input">{t("label")}</Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                type="email"
                placeholder={t("placeholder")}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" variant="outline" onClick={handleAddEmail}>
                {t("add")}
              </Button>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={emails.length === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t("submitting") : t("submit", { count: emails.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
