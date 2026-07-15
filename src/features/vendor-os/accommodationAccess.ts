import type { VendorOSModule } from './types';

export type VendorProviderFamily = 'accommodation' | 'generic';
export type VendorPlanTier = 'basic' | 'paid' | 'advanced';
export type VendorAccessEnforcementMode = 'open' | 'enforced';
export type ApprovalMode = 'open' | 'vendor_owner_only' | 'admin_approval_required';

export type AccommodationCapabilityKey =
  | 'bookings.manual_entry'
  | 'bookings.online_engine'
  | 'bookings.group_bookings'
  | 'bookings.reservation_changes'
  | 'bookings.rate_plan_controls'
  | 'bookings.ai_chatbot'
  | 'inventory.manual_updates'
  | 'inventory.ota_sync'
  | 'inventory.rule_based_rates'
  | 'inventory.dynamic_pricing'
  | 'checkin.manual'
  | 'checkin.mobile'
  | 'checkin.digital_keys'
  | 'billing.manual_folios'
  | 'billing.gst_invoice'
  | 'billing.integrated_payments'
  | 'billing.refund_controls'
  | 'billing.night_audit'
  | 'housekeeping.room_status'
  | 'housekeeping.mobile_tasks'
  | 'housekeeping.predictive_scheduling'
  | 'staff.manual_attendance'
  | 'staff.shift_scheduling'
  | 'staff.biometric_attendance'
  | 'analytics.occupancy_reports'
  | 'analytics.operational_dashboards'
  | 'analytics.ai_forecasting'
  | 'guest.manual_communication'
  | 'guest.automated_confirmations'
  | 'guest.whatsapp_automation';

export type ApprovalPolicyKey =
  | 'pricing_changes'
  | 'marketplace_publishing'
  | 'payout_actions'
  | 'refund_actions'
  | 'guest_automation'
  | 'ai_recommendations';

export interface VendorAccommodationAccessState {
  vendorProfileId: string;
  businessType: string;
  providerFamily: VendorProviderFamily;
  planTier: VendorPlanTier;
  enforcementMode: VendorAccessEnforcementMode;
  moduleOverrides: Partial<Record<VendorOSModule, boolean>>;
  capabilityOverrides: Partial<Record<AccommodationCapabilityKey, boolean>>;
  approvalOverrides: Partial<Record<ApprovalPolicyKey, ApprovalMode>>;
  updatedAt?: string;
}

export interface ResolvedVendorAccommodationAccess extends VendorAccommodationAccessState {
  isAccommodationProvider: boolean;
  visibleModules: VendorOSModule[];
  moduleVisibility: Record<VendorOSModule, boolean>;
  resolvedCapabilities: Record<AccommodationCapabilityKey, boolean>;
  resolvedApprovals: Record<ApprovalPolicyKey, ApprovalMode>;
}

export const accommodationBusinessTypeAliases = new Set([
  'accommodation',
  'accommodations',
  'boutique stay',
  'boutique_stay',
  'guesthouse',
  'homestay',
  'hostel',
  'hotel',
  'hotels',
  'resort',
  'resorts',
  'serviced apartment',
  'serviced_apartment',
  'stay',
  'stays',
  'villa',
  'villas',
]);

export const accommodationModules: VendorOSModule[] = [
  'dashboard',
  'crm',
  'calendar',
  'inbox',
  'accounting',
  'team',
  'pms',
  'ai_assistant',
  'marketplace',
  'subscriptions',
  'analytics',
  'branches',
  'documents',
  'settings',
];

const tierCapabilities: Record<VendorPlanTier, AccommodationCapabilityKey[]> = {
  basic: [
    'bookings.manual_entry',
    'inventory.manual_updates',
    'checkin.manual',
    'billing.manual_folios',
    'housekeeping.room_status',
    'staff.manual_attendance',
    'analytics.occupancy_reports',
    'guest.manual_communication',
  ],
  paid: [
    'bookings.manual_entry',
    'bookings.online_engine',
    'bookings.group_bookings',
    'bookings.reservation_changes',
    'bookings.rate_plan_controls',
    'inventory.manual_updates',
    'inventory.ota_sync',
    'inventory.rule_based_rates',
    'checkin.manual',
    'checkin.mobile',
    'checkin.digital_keys',
    'billing.manual_folios',
    'billing.gst_invoice',
    'billing.integrated_payments',
    'billing.refund_controls',
    'billing.night_audit',
    'housekeeping.room_status',
    'housekeeping.mobile_tasks',
    'staff.manual_attendance',
    'staff.shift_scheduling',
    'analytics.occupancy_reports',
    'analytics.operational_dashboards',
    'guest.manual_communication',
    'guest.automated_confirmations',
  ],
  advanced: [
    'bookings.manual_entry',
    'bookings.online_engine',
    'bookings.group_bookings',
    'bookings.reservation_changes',
    'bookings.rate_plan_controls',
    'bookings.ai_chatbot',
    'inventory.manual_updates',
    'inventory.ota_sync',
    'inventory.rule_based_rates',
    'inventory.dynamic_pricing',
    'checkin.manual',
    'checkin.mobile',
    'checkin.digital_keys',
    'billing.manual_folios',
    'billing.gst_invoice',
    'billing.integrated_payments',
    'billing.refund_controls',
    'billing.night_audit',
    'housekeeping.room_status',
    'housekeeping.mobile_tasks',
    'housekeeping.predictive_scheduling',
    'staff.manual_attendance',
    'staff.shift_scheduling',
    'staff.biometric_attendance',
    'analytics.occupancy_reports',
    'analytics.operational_dashboards',
    'analytics.ai_forecasting',
    'guest.manual_communication',
    'guest.automated_confirmations',
    'guest.whatsapp_automation',
  ],
};

const defaultApprovalPolicies: Record<ApprovalPolicyKey, ApprovalMode> = {
  pricing_changes: 'open',
  marketplace_publishing: 'open',
  payout_actions: 'open',
  refund_actions: 'open',
  guest_automation: 'open',
  ai_recommendations: 'open',
};

export const accommodationCapabilities: AccommodationCapabilityKey[] = [
  'bookings.manual_entry',
  'bookings.online_engine',
  'bookings.group_bookings',
  'bookings.reservation_changes',
  'bookings.rate_plan_controls',
  'bookings.ai_chatbot',
  'inventory.manual_updates',
  'inventory.ota_sync',
  'inventory.rule_based_rates',
  'inventory.dynamic_pricing',
  'checkin.manual',
  'checkin.mobile',
  'checkin.digital_keys',
  'billing.manual_folios',
  'billing.gst_invoice',
  'billing.integrated_payments',
  'billing.refund_controls',
  'billing.night_audit',
  'housekeeping.room_status',
  'housekeeping.mobile_tasks',
  'housekeeping.predictive_scheduling',
  'staff.manual_attendance',
  'staff.shift_scheduling',
  'staff.biometric_attendance',
  'analytics.occupancy_reports',
  'analytics.operational_dashboards',
  'analytics.ai_forecasting',
  'guest.manual_communication',
  'guest.automated_confirmations',
  'guest.whatsapp_automation',
];

export const approvalPolicyKeys: ApprovalPolicyKey[] = [
  'pricing_changes',
  'marketplace_publishing',
  'payout_actions',
  'refund_actions',
  'guest_automation',
  'ai_recommendations',
];

export function normalizeProviderFamily(businessType?: string | null): VendorProviderFamily {
  const normalized = String(businessType || '')
    .trim()
    .toLowerCase();

  return accommodationBusinessTypeAliases.has(normalized) ? 'accommodation' : 'generic';
}

export function buildDefaultVendorAccommodationAccess(input: {
  vendorProfileId: string;
  businessType?: string | null;
}): VendorAccommodationAccessState {
  return {
    vendorProfileId: input.vendorProfileId,
    businessType: String(input.businessType || ''),
    providerFamily: normalizeProviderFamily(input.businessType),
    planTier: 'advanced',
    enforcementMode: 'open',
    moduleOverrides: {},
    capabilityOverrides: {},
    approvalOverrides: {},
  };
}

export function resolveVendorAccommodationAccess(
  input: VendorAccommodationAccessState,
): ResolvedVendorAccommodationAccess {
  const isAccommodationProvider = input.providerFamily === 'accommodation';
  const defaultModuleVisibility = Object.fromEntries(
    ([
      'dashboard',
      'crm',
      'calendar',
      'inbox',
      'accounting',
      'team',
      'pms',
      'tours',
      'activities',
      'fleet',
      'ai_assistant',
      'marketplace',
      'subscriptions',
      'analytics',
      'branches',
      'documents',
      'settings',
    ] as VendorOSModule[]).map((module) => [module, !isAccommodationProvider || accommodationModules.includes(module)]),
  ) as Record<VendorOSModule, boolean>;

  const moduleVisibility = Object.fromEntries(
    (Object.keys(defaultModuleVisibility) as VendorOSModule[]).map((module) => {
      const override = input.moduleOverrides[module];
      const visible = typeof override === 'boolean' ? override : defaultModuleVisibility[module];
      return [module, visible];
    }),
  ) as Record<VendorOSModule, boolean>;

  const tierEnabled = new Set(tierCapabilities[input.planTier]);
  const resolvedCapabilities = Object.fromEntries(
    accommodationCapabilities.map((capability) => {
      if (!isAccommodationProvider) return [capability, false];
      if (input.enforcementMode === 'open') return [capability, true];
      if (typeof input.capabilityOverrides[capability] === 'boolean') {
        return [capability, Boolean(input.capabilityOverrides[capability])];
      }
      return [capability, tierEnabled.has(capability)];
    }),
  ) as Record<AccommodationCapabilityKey, boolean>;

  const resolvedApprovals = Object.fromEntries(
    approvalPolicyKeys.map((policy) => {
      if (!isAccommodationProvider || input.enforcementMode === 'open') return [policy, 'open'];
      return [policy, input.approvalOverrides[policy] || defaultApprovalPolicies[policy]];
    }),
  ) as Record<ApprovalPolicyKey, ApprovalMode>;

  return {
    ...input,
    isAccommodationProvider,
    visibleModules: (Object.keys(moduleVisibility) as VendorOSModule[]).filter((module) => moduleVisibility[module]),
    moduleVisibility,
    resolvedCapabilities,
    resolvedApprovals,
  };
}
