import { Input } from "@caseai-connect/ui/shad/input"
import type { Column } from "@tanstack/react-table"
import { ArrowUpDownIcon, SearchIcon } from "lucide-react"

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative max-w-sm">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        className="pl-8"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="search"
      />
    </div>
  )
}

export function SortableHeader<TData>({
  column,
  label,
}: {
  column: Column<TData, unknown>
  label: string
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => {
        column.toggleSorting()
      }}
    >
      {label}
      <ArrowUpDownIcon className="size-3.5" />
    </button>
  )
}
