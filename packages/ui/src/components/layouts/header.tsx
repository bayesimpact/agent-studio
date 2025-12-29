import { Button } from "@repo/ui/shad/button"
import { Separator } from "@repo/ui/shad/separator"
import { SidebarTrigger } from "@repo/ui/shad/sidebar"

export function LayoutHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://www.bayesimpact.org"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              Todo
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
