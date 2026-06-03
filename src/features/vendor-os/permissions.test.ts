import { describe, expect, it } from 'vitest';
import { canAccessVendorModule, getAllowedVendorModules } from './permissions';

describe('Vendor OS permissions', () => {
  it('gives owners every module action', () => {
    expect(canAccessVendorModule('owner', 'accounting', 'delete')).toBe(true);
    expect(canAccessVendorModule('owner', 'subscriptions', 'manage')).toBe(true);
    expect(canAccessVendorModule('owner', 'settings', 'export')).toBe(true);
  });

  it('keeps staff out of accounting and subscription management', () => {
    expect(canAccessVendorModule('staff', 'calendar', 'view')).toBe(true);
    expect(canAccessVendorModule('staff', 'pms', 'update')).toBe(true);
    expect(canAccessVendorModule('staff', 'accounting', 'view')).toBe(false);
    expect(canAccessVendorModule('staff', 'subscriptions', 'manage')).toBe(false);
  });

  it('lets accountants manage accounting and view documents', () => {
    expect(canAccessVendorModule('accountant', 'accounting', 'manage')).toBe(true);
    expect(canAccessVendorModule('accountant', 'documents', 'view')).toBe(true);
    expect(canAccessVendorModule('accountant', 'fleet', 'update')).toBe(false);
  });

  it('returns only viewable modules for a role', () => {
    expect(getAllowedVendorModules('sales')).toContain('crm');
    expect(getAllowedVendorModules('sales')).toContain('marketplace');
    expect(getAllowedVendorModules('sales')).not.toContain('fleet');
  });
});
