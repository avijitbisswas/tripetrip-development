import { describe, expect, it } from 'vitest';
import { getVendorMutationAccessError } from './mutationAccess';
import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';

const baseAccess: ResolvedVendorAccommodationAccess = {
  vendorProfileId: 'vendor-1',
  businessType: 'hotel',
  providerFamily: 'accommodation',
  planTier: 'advanced',
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
  resolvedCapabilities: {} as never,
  resolvedApprovals: {} as never,
};

describe('vendor mutation access', () => {
  it('allows writes when no accommodation access policy is present', () => {
    expect(getVendorMutationAccessError('crm', null)).toBeNull();
  });

  it('allows writes for visible modules', () => {
    expect(getVendorMutationAccessError('crm', baseAccess)).toBeNull();
  });

  it('blocks writes for hidden modules', () => {
    expect(getVendorMutationAccessError('fleet', baseAccess)).toBe(
      'This module is not enabled for this vendor account.',
    );
  });
});
