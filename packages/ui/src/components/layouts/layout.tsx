import { AppSidebar } from "@/components/layouts/sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/shad/sidebar"
import { LayoutHeader } from "./header"


export default function Layout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <LayoutHeader />
        <div className="flex flex-1 flex-col">
          {/* <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              SectionCards
              <div className="px-4 lg:px-6">
                ChartAreaInteractive
              </div>
              DataTable
            </div>
          </div> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
