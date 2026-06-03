import { describe, expect, it } from 'vitest';
import { vendorOSModules } from './data';
import { getVendorOSOperation, vendorOSOperations } from './operations';

describe('Vendor OS operations registry', () => {
  it('maps every module to an operational table', () => {
    for (const module of vendorOSModules) {
      const operation = getVendorOSOperation(module.id);

      expect(operation.module).toBe(module.id);
      expect(operation.table).toMatch(/^vendor_/);
      expect(operation.titleField).toBeTruthy();
      expect(operation.statusField).toBeTruthy();
    }
  });

  it('defines create fields for every non-dashboard module', () => {
    for (const module of vendorOSModules.filter((item) => item.id !== 'dashboard')) {
      expect(vendorOSOperations[module.id].createFields.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('uses module-specific tables for major travel systems', () => {
    expect(vendorOSOperations.crm.table).toBe('vendor_leads');
    expect(vendorOSOperations.calendar.table).toBe('vendor_calendar_events');
    expect(vendorOSOperations.pms.table).toBe('vendor_properties');
    expect(vendorOSOperations.tours.table).toBe('vendor_tour_itineraries');
    expect(vendorOSOperations.activities.table).toBe('vendor_activity_slots');
    expect(vendorOSOperations.fleet.table).toBe('vendor_vehicles');
  });
});
