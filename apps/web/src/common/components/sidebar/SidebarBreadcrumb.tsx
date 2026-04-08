import { Breadcrumb, BreadcrumbList } from "@caseai-connect/ui/shad/breadcrumb"
import { BreadcrumbAgent } from "@/common/components/breadcrumb/BreadcrumbAgent"
import { BreadcrumbAgentMembership } from "@/common/components/breadcrumb/BreadcrumbAgentMembership"
import { BreadcrumbAgentSession } from "@/common/components/breadcrumb/BreadcrumbAgentSession"
import { BreadcrumbAnalytics } from "@/common/components/breadcrumb/BreadcrumbAnalytics"
import { BreadcrumbDocuments } from "@/common/components/breadcrumb/BreadcrumbDocuments"
import { BreadcrumbEvaluations } from "@/common/components/breadcrumb/BreadcrumbEvaluations"
import { BreadcrumbFeedback } from "@/common/components/breadcrumb/BreadcrumbFeedback"
import { BreadcrumbProject } from "@/common/components/breadcrumb/BreadcrumbProject"
import { BreadcrumbProjectMembership } from "@/common/components/breadcrumb/BreadcrumbProjectMembership"
import type { Organization } from "@/common/features/organizations/organizations.models"

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
