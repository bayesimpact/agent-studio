// POC (issue #568) — v2 walkthroughs. Auto-syncing labels.
// Instead of copying UI strings by hand (which drifts when the app changes), we import
// the REAL i18next locale files from apps/web and resolve keys at build time. If a label
// changes in the product, the walkthrough picks it up on the next `astro build`.
// Only CHROME labels come from here; illustrative sample DATA (names, counts, urls) stays
// authored in each scene.
//
// Namespaced keys use the i18next form "namespace:path.to.key", with {{var}} interpolation
// and _one/_other pluralization on a numeric `count`.
import agentMembershipEn from "../../../web/src/studio/features/agent-memberships/locales/agent-membership.en.json"
import agentMembershipFr from "../../../web/src/studio/features/agent-memberships/locales/agent-membership.fr.json"
import agentEn from "../../../web/src/common/features/agents/locales/agent.en.json"
import agentFr from "../../../web/src/common/features/agents/locales/agent.fr.json"
import projectEn from "../../../web/src/common/features/projects/locales/project.en.json"
import projectFr from "../../../web/src/common/features/projects/locales/project.fr.json"
import evaluationEn from "../../../web/src/eval/features/evaluation-extraction-datasets/locales/evaluation.en.json"
import evaluationFr from "../../../web/src/eval/features/evaluation-extraction-datasets/locales/evaluation.fr.json"
import actionsEn from "../../../web/src/locales/actions.en.json"
import actionsFr from "../../../web/src/locales/actions.fr.json"
import analyticsEn from "../../../web/src/studio/features/analytics/project/locales/analytics.en.json"
import analyticsFr from "../../../web/src/studio/features/analytics/project/locales/analytics.fr.json"
import documentTagEn from "../../../web/src/studio/features/document-tags/locales/document-tag.en.json"
import documentTagFr from "../../../web/src/studio/features/document-tags/locales/document-tag.fr.json"
import documentEn from "../../../web/src/studio/features/documents/locales/document.en.json"
import documentFr from "../../../web/src/studio/features/documents/locales/document.fr.json"
import mcpServersEn from "../../../web/src/studio/features/mcp-servers/locales/mcp-servers.en.json"
import mcpServersFr from "../../../web/src/studio/features/mcp-servers/locales/mcp-servers.fr.json"
import projectAdminEn from "../../../web/src/studio/features/project-admin/locales/projectAdmin.en.json"
import projectAdminFr from "../../../web/src/studio/features/project-admin/locales/projectAdmin.fr.json"
import projectMembershipEn from "../../../web/src/studio/features/project-memberships/locales/project-membership.en.json"
import projectMembershipFr from "../../../web/src/studio/features/project-memberships/locales/project-membership.fr.json"
import resourceLibraryEn from "../../../web/src/studio/features/resource-libraries/locales/resource-library.en.json"
import resourceLibraryFr from "../../../web/src/studio/features/resource-libraries/locales/resource-library.fr.json"
import reviewCampaignsEn from "../../../web/src/studio/features/review-campaigns/locales/review-campaigns.en.json"
import reviewCampaignsFr from "../../../web/src/studio/features/review-campaigns/locales/review-campaigns.fr.json"

export type Lang = "en" | "fr"
type Dict = Record<string, unknown>

const BUNDLES: Record<Lang, Record<string, Dict>> = {
  en: {
    document: documentEn.document,
    documentTag: documentTagEn.documentTag,
    resourceLibrary: resourceLibraryEn.resourceLibrary,
    actions: actionsEn.actions,
    agent: agentEn.agent,
    project: projectEn.project,
    evaluation: evaluationEn.evaluation,
    analytics: analyticsEn.analytics,
    mcpServers: mcpServersEn.mcpServers,
    projectAdmin: projectAdminEn.projectAdmin,
    projectMembership: projectMembershipEn.projectMembership,
    reviewCampaigns: reviewCampaignsEn.reviewCampaigns,
  },
  fr: {
    document: documentFr.document,
    documentTag: documentTagFr.documentTag,
    resourceLibrary: resourceLibraryFr.resourceLibrary,
    actions: actionsFr.actions,
    agent: agentFr.agent,
    project: projectFr.project,
    evaluation: evaluationFr.evaluation,
    analytics: analyticsFr.analytics,
    mcpServers: mcpServersFr.mcpServers,
    projectAdmin: projectAdminFr.projectAdmin,
    projectMembership: projectMembershipFr.projectMembership,
    reviewCampaigns: reviewCampaignsFr.reviewCampaigns,
  },
}

function resolve(obj: Dict | undefined, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === "object" ? (acc as Dict)[key] : undefined),
      obj,
    )
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""))
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string

// Build a translator bound to a language. Missing keys return the key itself so drift is
// LOUD (a raw "document:foo.bar" on screen) rather than silently wrong.
export function makeT(lang: Lang): TFn {
  return (key, vars) => {
    const [ns, path] = key.split(":")
    const bundle = BUNDLES[lang][ns]
    if (!bundle || !path) return key
    let value: unknown
    if (vars && typeof vars.count === "number") {
      value =
        resolve(bundle, `${path}_${vars.count === 1 ? "one" : "other"}`) ?? resolve(bundle, path)
    } else {
      value = resolve(bundle, path)
    }
    return typeof value === "string" ? interpolate(value, vars) : key
  }
}
