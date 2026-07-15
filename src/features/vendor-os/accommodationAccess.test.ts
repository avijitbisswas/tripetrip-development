import { describe, expect, it } from 'vitest';
import {
  buildDefaultVendorAccommodationAccess,
  normalizeProviderFamily,
  resolveVendorAccommodationAccess,
} from './accommodationAccess';

describe('accommodation access', () => {
  it('normalizes accommodation business types into the accommodation family', () => {
    expect(normalizeProviderFamily('hotel')).toBe('accommodation');
    expect(normalizeProviderFamily('stays')).toBe('accommodation');
    expect(normalizeProviderFamily('villa')).toBe('accommodation');
    expect(normalizeProviderFamily('transport')).toBe('generic');
  });

  it('keeps accommodation modules open and hides non-accommodation modules by default', () => {
    const resolved = resolveVendorAccommodationAccess(
      buildDefaultVendorAccommodationAccess({
        vendorProfileId: 'vendor-1',
        businessType: 'hotel',
      }),
    );

    expect(resolved.isAccommodationProvider).toBe(true);
    expect(resolved.visibleModules).toContain('pms');
    expect(resolved.visibleModules).toContain('calendar');
    expect(resolved.visibleModules).not.toContain('fleet');
    expect(resolved.visibleModules).not.toContain('tours');
    expect(resolved.resolvedCapabilities['bookings.ai_chatbot']).toBe(true);
    expect(resolved.resolvedCapabilities['bookings.reservation_changes']).toBe(true);
    expect(resolved.resolvedCapabilities['bookings.rate_plan_controls']).toBe(true);
    expect(resolved.resolvedCapabilities['billing.refund_controls']).toBe(true);
    expect(resolved.resolvedCapabilities['billing.night_audit']).toBe(true);
    expect(resolved.resolvedApprovals.pricing_changes).toBe('open');
  });

  it('enforces tier and override rules when enforcement is enabled', () => {
    const resolved = resolveVendorAccommodationAccess({
      vendorProfileId: 'vendor-2',
      businessType: 'homestay',
      providerFamily: 'accommodation',
      planTier: 'basic',
      enforcementMode: 'enforced',
      moduleOverrides: { fleet: true },
      capabilityOverrides: {
        'guest.whatsapp_automation': true,
      },
      approvalOverrides: {
        pricing_changes: 'admin_approval_required',
      },
    });

    expect(resolved.moduleVisibility.fleet).toBe(true);
    expect(resolved.resolvedCapabilities['bookings.manual_entry']).toBe(true);
    expect(resolved.resolvedCapabilities['bookings.ai_chatbot']).toBe(false);
    expect(resolved.resolvedCapabilities['bookings.reservation_changes']).toBe(false);
    expect(resolved.resolvedCapabilities['bookings.rate_plan_controls']).toBe(false);
    expect(resolved.resolvedCapabilities['billing.refund_controls']).toBe(false);
    expect(resolved.resolvedCapabilities['billing.night_audit']).toBe(false);
    expect(resolved.resolvedCapabilities['guest.whatsapp_automation']).toBe(true);
    expect(resolved.resolvedApprovals.pricing_changes).toBe('admin_approval_required');
  });
});
