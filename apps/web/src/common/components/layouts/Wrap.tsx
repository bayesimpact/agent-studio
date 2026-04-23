import { cn } from "@caseai-connect/ui/utils"

export function Wrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "md:mx-10 2xl:mx-30 md:my-10 border-b md:border relative md:rounded-2xl overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  )
}
