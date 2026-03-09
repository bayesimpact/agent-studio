import { Breadcrumb, BreadcrumbList } from "@caseai-connect/ui/shad/breadcrumb"
import type { Organization } from "@/features/organizations/organizations.models"
import { BreadcrumbAdmin } from "./breadcrumb/BreadcrumbAdmin"
import { BreadcrumbAgent } from "./breadcrumb/BreadcrumbAgent"
import { BreadcrumbAgentSession } from "./breadcrumb/BreadcrumbAgentSession"
import { BreadcrumbDocuments } from "./breadcrumb/BreadcrumbDocuments"
import { BreadcrumbEvaluations } from "./breadcrumb/BreadcrumbEvaluations"
import { BreadcrumbFeedback } from "./breadcrumb/BreadcrumbFeedback"
import { BreadcrumbMembership } from "./breadcrumb/BreadcrumbMembership"
import { BreadcrumbProject } from "./breadcrumb/BreadcrumbProject"

export function SidebarBreadcrumb({ organization }: { organization: Organization }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbAdmin />

        <BreadcrumbProject organizationId={organization.id} />

        <BreadcrumbAgent organizationId={organization.id} />

        <BreadcrumbAgentSession organizationId={organization.id} />

        <BreadcrumbEvaluations />

        <BreadcrumbDocuments />

        <BreadcrumbMembership />

        <BreadcrumbFeedback />
      </BreadcrumbList>
    </Breadcrumb>
  )
}
