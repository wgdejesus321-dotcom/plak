import type { PlanId } from "./types";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  maxBioSites: number | null;
  customDomain: boolean;
  clientPortal: boolean;
  aiAssistant: boolean;
  removeBranding: boolean;
  analyticsDays: number;
}

/** Commercial prices are intentionally absent. Limits are advisory until billing is connected. */
export const PLANS: Record<PlanId, PlanDefinition> = {
  basic: { id: "basic", label: "Plano Básico", maxBioSites: 10, customDomain: false, clientPortal: false, aiAssistant: false, removeBranding: false, analyticsDays: 30 },
  premium: { id: "premium", label: "Plano Premium", maxBioSites: 50, customDomain: true, clientPortal: true, aiAssistant: true, removeBranding: true, analyticsDays: 90 },
  agency: { id: "agency", label: "Plano Agência", maxBioSites: null, customDomain: true, clientPortal: true, aiAssistant: true, removeBranding: true, analyticsDays: 365 },
};

export const ACTIVE_PLAN: PlanId = "agency";
export const PLAN_ENFORCEMENT_ENABLED = false;

export function canCreateBioSite(plan: PlanId, currentCount: number) {
  const limit = PLANS[plan].maxBioSites;
  return limit === null || currentCount < limit;
}
