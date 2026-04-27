import { randomUUID } from "node:crypto"
import type { ReviewCampaignMembership } from "../memberships/review-campaign-membership.entity"
import type { ReviewCampaign } from "../review-campaign.entity"
import type { ReviewCampaignStatus } from "../review-campaigns.types"
import { TesterPolicy } from "./tester.policy"

type CampaignOverrides = { id?: string; status?: ReviewCampaignStatus }
type MembershipOverrides = {
  campaignId?: string
  role?: "tester" | "reviewer"
}

const campaign = (overrides: CampaignOverrides = {}): ReviewCampaign =>
  ({
    id: overrides.id ?? "campaign-1",
    status: overrides.status ?? "active",
  }) as ReviewCampaign

const membership = (overrides: MembershipOverrides): ReviewCampaignMembership =>
  ({
    campaignId: overrides.campaignId ?? "campaign-1",
    role: overrides.role ?? "tester",
    userId: "user-1",
    id: randomUUID(),
  }) as ReviewCampaignMembership

describe("TesterPolicy", () => {
  describe("canActAsTester", () => {
    it("returns true when tester membership on active campaign", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "active" }),
        reviewCampaignMembership: membership({ role: "tester" }),
      })
      expect(policy.canActAsTester()).toBe(true)
    })

    it("returns false when membership is missing", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "active" }),
        reviewCampaignMembership: undefined,
      })
      expect(policy.canActAsTester()).toBe(false)
    })

    it("returns false when membership role is reviewer (not tester)", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "active" }),
        reviewCampaignMembership: membership({ role: "reviewer" }),
      })
      expect(policy.canActAsTester()).toBe(false)
    })

    it("returns false when membership is for a different campaign", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ id: "campaign-1" }),
        reviewCampaignMembership: membership({ campaignId: "campaign-2" }),
      })
      expect(policy.canActAsTester()).toBe(false)
    })

    it("returns false when campaign is draft", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "draft" }),
        reviewCampaignMembership: membership({ role: "tester" }),
      })
      expect(policy.canActAsTester()).toBe(false)
    })

    it("returns false when campaign is closed", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "closed" }),
        reviewCampaignMembership: membership({ role: "tester" }),
      })
      expect(policy.canActAsTester()).toBe(false)
    })
  })

  describe("canViewSharedContext", () => {
    it("allows a tester on an active campaign", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "active" }),
        reviewCampaignMembership: membership({ role: "tester" }),
      })
      expect(policy.canViewSharedContext()).toBe(true)
    })

    it("rejects a tester on a closed campaign (testers don't see closed campaigns)", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "closed" }),
        reviewCampaignMembership: membership({ role: "tester" }),
      })
      expect(policy.canViewSharedContext()).toBe(false)
    })

    it("allows a reviewer on an active campaign (shared landing-page metadata)", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "active" }),
        reviewCampaignMembership: membership({ role: "reviewer" }),
      })
      expect(policy.canViewSharedContext()).toBe(true)
    })

    it("allows a reviewer on a closed campaign (read access stays for closed)", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "closed" }),
        reviewCampaignMembership: membership({ role: "reviewer" }),
      })
      expect(policy.canViewSharedContext()).toBe(true)
    })

    it("rejects a reviewer on a draft campaign", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "draft" }),
        reviewCampaignMembership: membership({ role: "reviewer" }),
      })
      expect(policy.canViewSharedContext()).toBe(false)
    })

    it("rejects when membership is for a different campaign", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ id: "campaign-1", status: "active" }),
        reviewCampaignMembership: membership({ campaignId: "campaign-2", role: "reviewer" }),
      })
      expect(policy.canViewSharedContext()).toBe(false)
    })

    it("rejects when there is no membership at all", () => {
      const policy = new TesterPolicy({
        reviewCampaign: campaign({ status: "active" }),
        reviewCampaignMembership: undefined,
      })
      expect(policy.canViewSharedContext()).toBe(false)
    })
  })

  describe("BasePolicy method aliases", () => {
    const happyPolicy = new TesterPolicy({
      reviewCampaign: campaign({ status: "active" }),
      reviewCampaignMembership: membership({ role: "tester" }),
    })
    const sadPolicy = new TesterPolicy({
      reviewCampaign: campaign({ status: "closed" }),
      reviewCampaignMembership: membership({ role: "tester" }),
    })

    it("canList / canView / canCreate / canUpdate all route through canActAsTester", () => {
      expect(happyPolicy.canList()).toBe(true)
      expect(happyPolicy.canView()).toBe(true)
      expect(happyPolicy.canCreate()).toBe(true)
      expect(happyPolicy.canUpdate()).toBe(true)

      expect(sadPolicy.canList()).toBe(false)
      expect(sadPolicy.canView()).toBe(false)
      expect(sadPolicy.canCreate()).toBe(false)
      expect(sadPolicy.canUpdate()).toBe(false)
    })
  })
})
