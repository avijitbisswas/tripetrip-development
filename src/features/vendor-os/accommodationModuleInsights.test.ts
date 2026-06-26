import { describe, expect, it } from 'vitest';
import { getAccommodationModuleInsights } from './accommodationModuleInsights';
import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';

const buildAccess = (
  overrides: Partial<ResolvedVendorAccommodationAccess> = {},
): ResolvedVendorAccommodationAccess => ({
  vendorProfileId: 'vendor-1',
  businessType: 'hotel',
  providerFamily: 'accommodation',
  planTier: 'basic',
  enforcementMode: 'enforced',
  moduleOverrides: {},
  capabilityOverrides: {},
  approvalOverrides: {},
  isAccommodationProvider: true,
  visibleModules: ['dashboard', 'crm', 'calendar', 'inbox', 'team', 'pms', 'documents', 'settings'],
  moduleVisibility: {
    dashboard: true,
    crm: true,
    calendar: true,
    inbox: true,
    accounting: false,
    team: true,
    pms: true,
    tours: false,
    activities: false,
    fleet: false,
    ai_assistant: false,
    marketplace: false,
    subscriptions: false,
    analytics: false,
    branches: false,
    documents: true,
    settings: true,
  },
  resolvedCapabilities: {
    'bookings.manual_entry': true,
    'bookings.online_engine': false,
    'bookings.group_bookings': false,
    'bookings.ai_chatbot': false,
    'inventory.manual_updates': true,
    'inventory.ota_sync': false,
    'inventory.rule_based_rates': false,
    'inventory.dynamic_pricing': false,
    'checkin.manual': true,
    'checkin.mobile': false,
    'checkin.digital_keys': false,
    'billing.manual_folios': true,
    'billing.gst_invoice': false,
    'billing.integrated_payments': false,
    'housekeeping.room_status': true,
    'housekeeping.mobile_tasks': false,
    'housekeeping.predictive_scheduling': false,
    'staff.manual_attendance': true,
    'staff.shift_scheduling': false,
    'staff.biometric_attendance': false,
    'analytics.occupancy_reports': true,
    'analytics.operational_dashboards': false,
    'analytics.ai_forecasting': false,
    'guest.manual_communication': true,
    'guest.automated_confirmations': false,
    'guest.whatsapp_automation': false,
  },
  resolvedApprovals: {
    pricing_changes: 'vendor_owner_only',
    marketplace_publishing: 'admin_approval_required',
    payout_actions: 'open',
    refund_actions: 'open',
    guest_automation: 'open',
    ai_recommendations: 'admin_approval_required',
  },
  ...overrides,
});

describe('getAccommodationModuleInsights', () => {
  it('returns null for non-accommodation access', () => {
    expect(
      getAccommodationModuleInsights('pms', buildAccess({ isAccommodationProvider: false })),
    ).toBeNull();
  });

  it('describes locked PMS automation and approvals for enforced accommodation vendors', () => {
    const insight = getAccommodationModuleInsights('pms', buildAccess());

    expect(insight?.title).toBe('Accommodation controls');
    expect(insight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Mobile check-in', status: 'Locked on basic' }),
        expect.objectContaining({ label: 'GST folios', status: 'Upgrade to unlock' }),
      ]),
    );
  });

  it('describes marketplace publishing and pricing approvals', () => {
    const insight = getAccommodationModuleInsights('marketplace', buildAccess());

    expect(insight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Publishing', status: 'Admin approval' }),
        expect.objectContaining({ label: 'Pricing changes', status: 'Owner approval' }),
      ]),
    );
  });

  it('keeps open-mode accommodations permissive', () => {
    const insight = getAccommodationModuleInsights(
      'analytics',
      buildAccess({ enforcementMode: 'open', planTier: 'advanced' }),
    );

    expect(insight?.summary).toContain('open mode');
    expect(insight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Operational dashboards', status: 'Open' }),
      ]),
    );
  });

  it('describes accounting approvals for payouts and guest automation', () => {
    const insight = getAccommodationModuleInsights('accounting', buildAccess());

    expect(insight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Payout actions', status: 'Open' }),
        expect.objectContaining({ label: 'Refund actions', status: 'Open' }),
      ]),
    );
  });

  it('describes guest communication and automation in CRM and inbox', () => {
    const crmInsight = getAccommodationModuleInsights('crm', buildAccess());
    const inboxInsight = getAccommodationModuleInsights('inbox', buildAccess());

    expect(crmInsight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Automated confirmations', status: 'Locked' }),
      ]),
    );
    expect(inboxInsight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Guest automation', status: 'Open' }),
      ]),
    );
  });

  it('describes settings approvals and availability posture', () => {
    const insight = getAccommodationModuleInsights('settings', buildAccess());

    expect(insight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Pricing changes', status: 'Owner approval' }),
        expect.objectContaining({ label: 'Publishing policy', status: 'Admin approval' }),
      ]),
    );
  });

  it('describes staffing, document, and subscription controls for accommodation vendors', () => {
    const teamInsight = getAccommodationModuleInsights('team', buildAccess());
    const documentsInsight = getAccommodationModuleInsights('documents', buildAccess());
    const subscriptionsInsight = getAccommodationModuleInsights('subscriptions', buildAccess());

    expect(teamInsight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Shift scheduling', status: 'Upgrade to unlock' }),
        expect.objectContaining({ label: 'Biometric attendance', status: 'Locked' }),
      ]),
    );
    expect(documentsInsight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'WhatsApp automation', status: 'Advanced only' }),
        expect.objectContaining({ label: 'Document approvals', status: 'Admin approval' }),
      ]),
    );
    expect(subscriptionsInsight?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Current plan', status: 'Basic' }),
        expect.objectContaining({ label: 'Refund actions', status: 'Open' }),
      ]),
    );
  });
});
