import { InfoIcon } from "lucide-react"

export function BlindBanner() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <p className="text-sm">
        The tester's rating and comment are hidden until you submit your own review — so your
        judgment stays independent.
      </p>
    </div>
  )
}
