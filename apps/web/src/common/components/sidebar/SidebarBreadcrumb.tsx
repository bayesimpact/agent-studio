import { Breadcrumb, BreadcrumbList } from "@caseai-connect/ui/shad/breadcrumb"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { BreadcrumbAgent } from "@/components/breadcrumb/BreadcrumbAgent"
import { BreadcrumbAgentMembership } from "@/components/breadcrumb/BreadcrumbAgentMembership"
import { BreadcrumbAgentSession } from "@/components/breadcrumb/BreadcrumbAgentSession"
import { BreadcrumbAnalytics } from "@/components/breadcrumb/BreadcrumbAnalytics"
import { BreadcrumbDocuments } from "@/components/breadcrumb/BreadcrumbDocuments"
import { BreadcrumbEvaluations } from "@/components/breadcrumb/BreadcrumbEvaluations"
import { BreadcrumbFeedback } from "@/components/breadcrumb/BreadcrumbFeedback"
import { BreadcrumbProject } from "@/components/breadcrumb/BreadcrumbProject"
import { BreadcrumbProjectMembership } from "@/components/breadcrumb/BreadcrumbProjectMembership"

export function SidebarBreadcrumb({ organization }: { organization: Organization }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbProject organization={organization} />

        <BreadcrumbAgent organizationId={organization.id} />

        <BreadcrumbAgentSession organizationId={organization.id} />

        <BreadcrumbEvaluations />

        <BreadcrumbDocuments />

        <BreadcrumbAnalytics />

        <BreadcrumbProjectMembership />

        <BreadcrumbAgentMembership />

        <BreadcrumbFeedback />
      </BreadcrumbList>
    </Breadcrumb>
  )
}
