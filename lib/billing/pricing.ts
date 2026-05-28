export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const BILLING_CYCLES = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const PLAN_IDS = [
  "starter",
  "growth",
  "business",
  "enterprise",
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const SUBSCRIPTION_STATUSES = [
  "free",
  "trialing",
  "active",
  "past_due",
  "cancelled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PLAN_LIMIT_KEYS = [
  "outlets",
  "registers",
  "users",
  "products",
] as const;
export type PlanLimitKey = (typeof PLAN_LIMIT_KEYS)[number];

export type PlanLimits = Record<PlanLimitKey, number | null>;

export const SUBSCRIPTION_FEATURES = [
  "pos",
  "posCheckout",
  "salesTracking",
  "inventory",
  "basicInventory",
  "receipts",
  "dailySalesSummary",
  "productCategories",
  "basicReporting",
  "lowStockAlertsBasic",
  "barcodeScanning",
  "customerAccounts",
  "loyaltyHistory",
  "returnsRefunds",
  "discounts",
  "expenseTracking",
  "supplierManagementBasic",
  "purchaseRecords",
  "reports",
  "standardReports",
  "exportReports",
  "team",
  "staffPermissionsBasic",
  "offlineSync",
  "notifications",
  "whatsAppReceipts",
  "inventoryAdjustments",
  "stockMovementTracking",
  "multiBranchInventory",
  "advancedReporting",
  "auditLogs",
  "advancedPermissions",
  "roleBasedPermissions",
  "purchaseOrders",
  "supplierManagementAdvanced",
  "pharmacyExpiryTracking",
  "restaurantTables",
  "kitchenOrderTickets",
  "branchAnalytics",
  "inventoryTransfers",
  "stockValuation",
  "advancedPromotions",
  "approvalWorkflows",
  "organizationManagement",
  "advancedBranding",
  "apiAccess",
  "whiteLabeling",
  "dedicatedOnboarding",
  "prioritySupport",
  "slaSupport",
  "customIntegrations",
  "advancedAnalytics",
  "customPermissions",
  "enterpriseTools",
] as const;
export type SubscriptionFeature = (typeof SUBSCRIPTION_FEATURES)[number];

export type PricingRegionId =
  | "global"
  | "eastAfricaPreview"
  | "indiaPreview"
  | "usUkPreview";

type RegionPriceOverride = Partial<
  Record<PlanId, Partial<Record<BillingInterval, number | null>>>
>;

export type PricingRegion = {
  id: PricingRegionId;
  label: string;
  currency: "USD";
  isPreviewOnly?: boolean;
  priceOverrides: RegionPriceOverride;
};

export type PricingPlan = {
  id: PlanId;
  name: string;
  badge?: string;
  label: string;
  description: string;
  positioning: string;
  bestFor: string;
  targetCustomers: string[];
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  cta: string;
  recommended?: boolean;
  limits: PlanLimits;
  limitLabels: string[];
  features: string[];
  restrictions?: string[];
  featureKeys: readonly SubscriptionFeature[];
  featureFlags?: Partial<Record<SubscriptionFeature, boolean>>;
};

export type SubscriptionLike = {
  plan?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  billing_cycle?: string | null;
  trial_ends_at?: string | null;
  current_period_ends_at?: string | null;
};

export const PRICING_REGIONS: Record<PricingRegionId, PricingRegion> = {
  global: {
    id: "global",
    label: "Global USD",
    currency: "USD",
    priceOverrides: {},
  },
  eastAfricaPreview: {
    id: "eastAfricaPreview",
    label: "East Africa preview",
    currency: "USD",
    isPreviewOnly: true,
    priceOverrides: {
      growth: { month: 700, year: 7000 },
      business: { month: 2500, year: 25000 },
    },
  },
  indiaPreview: {
    id: "indiaPreview",
    label: "India preview",
    currency: "USD",
    isPreviewOnly: true,
    priceOverrides: {
      growth: { month: 500, year: 5000 },
      business: { month: 1900, year: 19000 },
    },
  },
  usUkPreview: {
    id: "usUkPreview",
    label: "US/UK preview",
    currency: "USD",
    isPreviewOnly: true,
    priceOverrides: {
      growth: { month: 2900, year: 29000 },
      business: { month: 9900, year: 99000 },
    },
  },
};

export const DEFAULT_PRICING_REGION: PricingRegionId = "global";

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    label: "Free forever",
    description: "Start selling today",
    positioning: "Start selling today",
    bestFor: "Kiosks, counters, salons, pharmacies, and small retail",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    cta: "Upgrade to Growth",
    targetCustomers: [
      "Kiosk",
      "Mini mart",
      "Single-counter supermarket",
      "Startup restaurant",
      "Pharmacy counter",
      "Salon / small retail",
    ],
    limits: {
      outlets: 1,
      registers: 1,
      users: 2,
      products: 300,
    },
    limitLabels: ["1 outlet", "1 register", "2 users", "300 products/SKUs"],
    features: [
      "POS checkout",
      "Sales tracking",
      "Basic inventory",
      "Receipts",
      "Daily sales summary",
      "Product categories",
      "Basic reporting",
      "Basic low stock alerts",
    ],
    restrictions: [
      "No barcode scanning",
      "No customer loyalty/accounts",
      "No advanced analytics",
      "No multi-branch",
      "No pharmacy expiry tracking",
      "No restaurant kitchen workflow",
      "No audit logs",
    ],
    featureKeys: [
      "pos",
      "posCheckout",
      "salesTracking",
      "inventory",
      "basicInventory",
      "receipts",
      "dailySalesSummary",
      "productCategories",
      "basicReporting",
      "lowStockAlertsBasic",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    badge: "Most popular",
    label: "For growing shops",
    description: "For growing shops",
    positioning: "For growing shops",
    bestFor: "Growing shops, pharmacies, restaurants, and wholesalers",
    monthlyPriceCents: 900,
    yearlyPriceCents: 9000,
    cta: "Upgrade to Business",
    recommended: true,
    targetCustomers: [
      "Growing supermarkets",
      "Mini chains",
      "Pharmacies",
      "Restaurants",
      "Wholesalers",
      "Serious retail shops",
    ],
    limits: {
      outlets: 2,
      registers: 5,
      users: 8,
      products: 10000,
    },
    limitLabels: [
      "Up to 2 outlets",
      "Up to 5 registers",
      "Up to 8 users",
      "10,000 products",
    ],
    features: [
      "Everything in Starter",
      "Barcode scanning",
      "Customer accounts",
      "Loyalty/customer history",
      "Stock alerts",
      "Returns/refunds",
      "Discounts",
      "Expense tracking",
      "Supplier management (basic)",
      "Purchase records",
      "Standard reports",
      "Export reports",
      "Staff permissions (basic)",
      "WhatsApp receipt support",
      "Inventory adjustments",
      "Stock movement tracking",
    ],
    featureKeys: [
      "pos",
      "posCheckout",
      "salesTracking",
      "inventory",
      "basicInventory",
      "receipts",
      "dailySalesSummary",
      "productCategories",
      "basicReporting",
      "lowStockAlertsBasic",
      "barcodeScanning",
      "customerAccounts",
      "loyaltyHistory",
      "returnsRefunds",
      "discounts",
      "expenseTracking",
      "supplierManagementBasic",
      "purchaseRecords",
      "reports",
      "standardReports",
      "exportReports",
      "team",
      "staffPermissionsBasic",
      "offlineSync",
      "notifications",
      "whatsAppReceipts",
      "inventoryAdjustments",
      "stockMovementTracking",
    ],
    featureFlags: {
      whatsAppReceipts: false,
    },
  },
  business: {
    id: "business",
    name: "Business",
    label: "For serious operators",
    description: "For supermarkets & serious operators",
    positioning: "For supermarkets & serious operators",
    bestFor: "Multi-location retail, pharmacies, restaurants, and wholesalers",
    monthlyPriceCents: 2900,
    yearlyPriceCents: 29000,
    cta: "Upgrade",
    targetCustomers: [
      "Supermarkets",
      "Pharmacies",
      "Restaurant chains",
      "Wholesalers",
      "Multi-location retail",
    ],
    limits: {
      outlets: 10,
      registers: null,
      users: 50,
      products: null,
    },
    limitLabels: [
      "Up to 10 outlets",
      "Unlimited registers",
      "Up to 50 users",
      "Unlimited products",
    ],
    features: [
      "Everything in Growth",
      "Multi-branch inventory",
      "Advanced reporting",
      "Audit logs",
      "Role-based permissions",
      "Purchase orders",
      "Supplier management (advanced)",
      "Pharmacy expiry tracking",
      "Restaurant tables",
      "Kitchen order tickets (KOT)",
      "Branch-level analytics",
      "Inventory transfers",
      "Stock valuation",
      "Advanced discounts/promotions",
      "Approval workflows",
      "Organization management",
    ],
    featureKeys: [
      "pos",
      "posCheckout",
      "salesTracking",
      "inventory",
      "basicInventory",
      "receipts",
      "dailySalesSummary",
      "productCategories",
      "basicReporting",
      "lowStockAlertsBasic",
      "barcodeScanning",
      "customerAccounts",
      "loyaltyHistory",
      "returnsRefunds",
      "discounts",
      "expenseTracking",
      "supplierManagementBasic",
      "purchaseRecords",
      "reports",
      "standardReports",
      "exportReports",
      "team",
      "staffPermissionsBasic",
      "offlineSync",
      "notifications",
      "whatsAppReceipts",
      "inventoryAdjustments",
      "stockMovementTracking",
      "multiBranchInventory",
      "advancedReporting",
      "auditLogs",
      "advancedPermissions",
      "roleBasedPermissions",
      "purchaseOrders",
      "supplierManagementAdvanced",
      "pharmacyExpiryTracking",
      "restaurantTables",
      "kitchenOrderTickets",
      "branchAnalytics",
      "inventoryTransfers",
      "stockValuation",
      "advancedPromotions",
      "approvalWorkflows",
      "organizationManagement",
      "advancedBranding",
    ],
    featureFlags: {
      whatsAppReceipts: false,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    label: "Custom pricing",
    description: "For large organizations",
    positioning: "For large chains",
    bestFor: "Large chains and enterprise operators",
    monthlyPriceCents: null,
    yearlyPriceCents: null,
    cta: "Contact Sales",
    targetCustomers: ["Large chains", "Franchises", "Enterprise operators"],
    limits: {
      outlets: null,
      registers: null,
      users: null,
      products: null,
    },
    limitLabels: [
      "Unlimited outlets",
      "Unlimited registers",
      "Unlimited users",
      "Unlimited products",
    ],
    features: [
      "Everything in Business",
      "API access",
      "White labeling",
      "Dedicated onboarding",
      "Priority support",
      "SLA support",
      "Custom integrations",
      "Advanced analytics",
      "Custom permissions",
      "Multi-tenant enterprise tools",
    ],
    featureKeys: [
      "pos",
      "posCheckout",
      "salesTracking",
      "inventory",
      "basicInventory",
      "receipts",
      "dailySalesSummary",
      "productCategories",
      "basicReporting",
      "lowStockAlertsBasic",
      "barcodeScanning",
      "customerAccounts",
      "loyaltyHistory",
      "returnsRefunds",
      "discounts",
      "expenseTracking",
      "supplierManagementBasic",
      "purchaseRecords",
      "reports",
      "standardReports",
      "exportReports",
      "team",
      "staffPermissionsBasic",
      "offlineSync",
      "notifications",
      "whatsAppReceipts",
      "inventoryAdjustments",
      "stockMovementTracking",
      "multiBranchInventory",
      "advancedReporting",
      "auditLogs",
      "advancedPermissions",
      "roleBasedPermissions",
      "purchaseOrders",
      "supplierManagementAdvanced",
      "pharmacyExpiryTracking",
      "restaurantTables",
      "kitchenOrderTickets",
      "branchAnalytics",
      "inventoryTransfers",
      "stockValuation",
      "advancedPromotions",
      "approvalWorkflows",
      "organizationManagement",
      "advancedBranding",
      "apiAccess",
      "whiteLabeling",
      "dedicatedOnboarding",
      "prioritySupport",
      "slaSupport",
      "customIntegrations",
      "advancedAnalytics",
      "customPermissions",
      "enterpriseTools",
    ],
    featureFlags: {
      whatsAppReceipts: false,
    },
  },
};

export const PRICING_PLAN_LIST = PLAN_IDS.map((id) => PRICING_PLANS[id]);

export const PLAN_RANK: Record<PlanId, number> = {
  starter: 0,
  growth: 1,
  business: 2,
  enterprise: 3,
};

export const FEATURE_LABELS: Record<SubscriptionFeature, string> = {
  pos: "POS checkout",
  posCheckout: "POS checkout",
  salesTracking: "sales tracking",
  inventory: "inventory",
  basicInventory: "basic inventory",
  receipts: "receipts",
  dailySalesSummary: "daily sales summary",
  productCategories: "product categories",
  basicReporting: "basic reporting",
  lowStockAlertsBasic: "basic low stock alerts",
  barcodeScanning: "barcode scanning",
  customerAccounts: "customer accounts",
  loyaltyHistory: "loyalty/customer history",
  returnsRefunds: "returns and refunds",
  discounts: "discounts",
  expenseTracking: "expense tracking",
  supplierManagementBasic: "basic supplier management",
  purchaseRecords: "purchase records",
  reports: "reports",
  standardReports: "standard reports",
  exportReports: "report exports",
  team: "team management",
  staffPermissionsBasic: "basic staff permissions",
  offlineSync: "offline checkout queue",
  notifications: "notifications",
  whatsAppReceipts: "WhatsApp receipts",
  inventoryAdjustments: "inventory adjustments",
  stockMovementTracking: "stock movement tracking",
  multiBranchInventory: "multi-branch inventory",
  advancedReporting: "advanced reporting",
  auditLogs: "audit logs",
  advancedPermissions: "advanced permissions",
  roleBasedPermissions: "role-based permissions",
  purchaseOrders: "purchase orders",
  supplierManagementAdvanced: "advanced supplier management",
  pharmacyExpiryTracking: "pharmacy expiry tracking",
  restaurantTables: "restaurant tables",
  kitchenOrderTickets: "kitchen order tickets",
  branchAnalytics: "branch-level analytics",
  inventoryTransfers: "inventory transfers",
  stockValuation: "stock valuation",
  advancedPromotions: "advanced discounts/promotions",
  approvalWorkflows: "approval workflows",
  organizationManagement: "organization management",
  advancedBranding: "appearance and branding",
  apiAccess: "API access",
  whiteLabeling: "white labeling",
  dedicatedOnboarding: "dedicated onboarding",
  prioritySupport: "priority support",
  slaSupport: "SLA support",
  customIntegrations: "custom integrations",
  advancedAnalytics: "advanced analytics",
  customPermissions: "custom permissions",
  enterpriseTools: "multi-tenant enterprise tools",
};

export const FEATURE_REQUIRED_PLAN: Record<SubscriptionFeature, PlanId> = {
  pos: "starter",
  posCheckout: "starter",
  salesTracking: "starter",
  inventory: "starter",
  basicInventory: "starter",
  receipts: "starter",
  dailySalesSummary: "starter",
  productCategories: "starter",
  basicReporting: "starter",
  lowStockAlertsBasic: "starter",
  barcodeScanning: "growth",
  customerAccounts: "growth",
  loyaltyHistory: "growth",
  returnsRefunds: "growth",
  discounts: "growth",
  expenseTracking: "growth",
  supplierManagementBasic: "growth",
  purchaseRecords: "growth",
  reports: "growth",
  standardReports: "growth",
  exportReports: "growth",
  team: "growth",
  staffPermissionsBasic: "growth",
  offlineSync: "growth",
  notifications: "growth",
  whatsAppReceipts: "growth",
  inventoryAdjustments: "growth",
  stockMovementTracking: "growth",
  multiBranchInventory: "business",
  advancedReporting: "business",
  auditLogs: "business",
  advancedPermissions: "business",
  roleBasedPermissions: "business",
  purchaseOrders: "business",
  supplierManagementAdvanced: "business",
  pharmacyExpiryTracking: "business",
  restaurantTables: "business",
  kitchenOrderTickets: "business",
  branchAnalytics: "business",
  inventoryTransfers: "business",
  stockValuation: "business",
  advancedPromotions: "business",
  approvalWorkflows: "business",
  organizationManagement: "business",
  advancedBranding: "business",
  apiAccess: "enterprise",
  whiteLabeling: "enterprise",
  dedicatedOnboarding: "enterprise",
  prioritySupport: "enterprise",
  slaSupport: "enterprise",
  customIntegrations: "enterprise",
  advancedAnalytics: "enterprise",
  customPermissions: "enterprise",
  enterpriseTools: "enterprise",
};

export function parsePlanId(value: unknown): PlanId | null {
  if (value === "pro") return "business";
  return typeof value === "string" && PLAN_IDS.includes(value as PlanId)
    ? (value as PlanId)
    : null;
}

export function normalizePlanId(value: unknown): PlanId {
  return parsePlanId(value) ?? "starter";
}

export function parseBillingInterval(value: unknown): BillingInterval | null {
  if (value === "monthly") return "month";
  if (value === "yearly") return "year";
  return typeof value === "string" &&
    BILLING_INTERVALS.includes(value as BillingInterval)
    ? (value as BillingInterval)
    : null;
}

export function normalizeBillingInterval(value: unknown): BillingInterval {
  return parseBillingInterval(value) ?? "month";
}

export function billingIntervalToCycle(
  interval: BillingInterval,
): BillingCycle {
  return interval === "year" ? "yearly" : "monthly";
}

export function billingCycleToInterval(cycle: BillingCycle): BillingInterval {
  return cycle === "yearly" ? "year" : "month";
}

export function parseBillingCycle(value: unknown): BillingCycle | null {
  if (value === "month") return "monthly";
  if (value === "year") return "yearly";
  return typeof value === "string" &&
    BILLING_CYCLES.includes(value as BillingCycle)
    ? (value as BillingCycle)
    : null;
}

export function normalizeBillingCycle(value: unknown): BillingCycle {
  return parseBillingCycle(value) ?? "monthly";
}

export function parseSubscriptionStatus(
  value: unknown,
): SubscriptionStatus | null {
  if (value === "inactive") return "cancelled";
  if (value === "canceled") return "cancelled";
  return typeof value === "string" &&
    SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus)
    ? (value as SubscriptionStatus)
    : null;
}

export function normalizeSubscriptionStatus(
  value: unknown,
): SubscriptionStatus {
  return parseSubscriptionStatus(value) ?? "free";
}

export function comparePlans(planId: PlanId, requiredPlanId: PlanId) {
  return PLAN_RANK[planId] - PLAN_RANK[requiredPlanId];
}

export function getRequiredPlanForFeature(feature: SubscriptionFeature) {
  return FEATURE_REQUIRED_PLAN[feature];
}

export function planIncludesFeature(
  planId: PlanId,
  feature: SubscriptionFeature,
) {
  return comparePlans(planId, getRequiredPlanForFeature(feature)) >= 0;
}

export function getPlanPriceCents(
  planId: PlanId,
  interval: BillingInterval,
  regionId: PricingRegionId = DEFAULT_PRICING_REGION,
) {
  const region = PRICING_REGIONS[regionId] ?? PRICING_REGIONS.global;
  const override = region.priceOverrides[planId]?.[interval];
  if (override !== undefined) return override;
  const plan = PRICING_PLANS[planId];
  return interval === "year" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
}

export function getAnnualSavingsCents(planId: PlanId) {
  const monthly = getPlanPriceCents(planId, "month");
  const yearly = getPlanPriceCents(planId, "year");
  if (monthly === null || yearly === null) return null;
  return Math.max(0, monthly * 12 - yearly);
}

export function getAnnualSavingsPercent(planId: PlanId) {
  const monthly = getPlanPriceCents(planId, "month");
  const savings = getAnnualSavingsCents(planId);
  if (!monthly || savings === null) return 0;
  return Math.round((savings / (monthly * 12)) * 100);
}

export function formatPlanPrice(planId: PlanId, interval: BillingInterval) {
  const priceCents = getPlanPriceCents(planId, interval);
  if (priceCents === null) return "Custom";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export function getMonthlyEquivalentCents(planId: PlanId) {
  const yearly = PRICING_PLANS[planId].yearlyPriceCents;
  return yearly === null ? null : Math.round(yearly / 12);
}

export function getPlanFromSubscription(
  settings: SubscriptionLike | null | undefined,
) {
  return normalizePlanId(settings?.plan ?? settings?.subscription_plan);
}

/** Plan used for feature gates and usage limits during an active trial. */
export const TRIAL_EFFECTIVE_PLAN: PlanId = "business";

export const TRIAL_DURATION_DAYS = 30;

export function isActiveTrial(settings: SubscriptionLike | null | undefined) {
  if (!settings) return false;
  if (normalizeSubscriptionStatus(settings.subscription_status) !== "trialing") {
    return false;
  }
  if (!settings.trial_ends_at) return true;
  return new Date(settings.trial_ends_at).getTime() > Date.now();
}

export function isExpiredTrial(settings: SubscriptionLike | null | undefined) {
  if (!settings) return false;
  if (normalizeSubscriptionStatus(settings.subscription_status) !== "trialing") {
    return false;
  }
  if (!settings.trial_ends_at) return false;
  return new Date(settings.trial_ends_at).getTime() <= Date.now();
}

/** Stored plan for billing UI; elevated to Business limits/features while trialing. */
export function getEffectivePlanForAccess(
  settings: SubscriptionLike | null | undefined,
): PlanId {
  if (isActiveTrial(settings)) return TRIAL_EFFECTIVE_PLAN;
  return getPlanFromSubscription(settings);
}

export function getPlanLimits(
  settings: SubscriptionLike | PlanId | null | undefined,
) {
  const planId =
    typeof settings === "string"
      ? normalizePlanId(settings)
      : getEffectivePlanForAccess(
          typeof settings === "object" ? settings : null,
        );
  return PRICING_PLANS[planId].limits;
}

export function hasReachedLimit(
  settings: SubscriptionLike | PlanId | null | undefined,
  limitKey: PlanLimitKey,
  currentCount: number,
) {
  const limit = getPlanLimits(settings)[limitKey];
  return limit !== null && currentCount >= limit;
}

export function canUseFeature(
  settings: SubscriptionLike | null | undefined,
  featureKey: SubscriptionFeature,
) {
  const access = enforceSubscriptionAccess(settings);
  if (!access.ok) return false;
  return planIncludesFeature(
    getEffectivePlanForAccess(settings),
    featureKey,
  );
}

export function assertFeatureAccess(
  settings: SubscriptionLike | null | undefined,
  featureKey: SubscriptionFeature,
) {
  if (canUseFeature(settings, featureKey)) return;

  const recommendation = getUpgradeRecommendation(featureKey);
  throw new Error(
    `${FEATURE_LABELS[featureKey]} requires ${PRICING_PLANS[recommendation.plan].name}.`,
  );
}

export function getUpgradeRecommendation(feature: SubscriptionFeature) {
  const plan = getRequiredPlanForFeature(feature);
  return {
    plan,
    feature,
    title: `Unlock ${FEATURE_LABELS[feature]}`,
    message:
      plan === "growth"
        ? "Upgrade to Growth to unlock barcode scanning, customer accounts, and up to 10,000 products."
        : plan === "business"
          ? "Upgrade to Business to unlock advanced operations, multi-branch workflows, and stronger controls."
          : "Contact Sales to unlock enterprise-grade controls and custom integrations.",
    cta: PRICING_PLANS[plan].cta,
  };
}

export function enforceSubscriptionAccess(
  settings: SubscriptionLike | null | undefined,
) {
  if (!settings) {
    return { ok: false, reason: "missing_settings" as const };
  }

  const status = normalizeSubscriptionStatus(settings.subscription_status);
  if (status === "free" || status === "active") {
    return { ok: true, reason: null };
  }

  if (status === "trialing") {
    return { ok: true, reason: null };
  }

  return { ok: false, reason: status };
}
