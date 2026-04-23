import { cn } from "@caseai-connect/ui/utils"
import { StarIcon } from "lucide-react"

type Props = {
  value: number | null
  onChange?: (value: number) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  max?: number
  "aria-label"?: string
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = "md",
  max = 5,
  "aria-label": ariaLabel = "Rating",
}: Props) {
  const interactive = !disabled && !!onChange
  return (
    <fieldset
      className="flex items-center gap-1 border-0 p-0"
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1
        const filled = value !== null && starValue <= value
        return (
          <button
            key={starValue}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(starValue)}
            aria-label={`${starValue} ${starValue === 1 ? "star" : "stars"}`}
            className={cn(
              "rounded p-0.5 transition-colors",
              interactive ? "hover:bg-accent" : "cursor-default",
            )}
          >
            <StarIcon
              className={cn(
                SIZE_CLASS[size],
                filled ? "fill-primary text-primary" : "text-muted-foreground",
              )}
            />
          </button>
        )
      })}
    </fieldset>
  )
}
