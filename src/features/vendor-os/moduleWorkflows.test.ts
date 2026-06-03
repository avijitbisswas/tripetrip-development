import { describe, expect, it } from 'vitest';
import { vendorOSModules } from './data';
import { vendorOSWorkflows } from './moduleWorkflows';

describe('Vendor OS module workflows', () => {
  it('defines a workspace for every Vendor OS module', () => {
    const workflowIds = Object.keys(vendorOSWorkflows).sort();
    const moduleIds = vendorOSModules.map((module) => module.id).sort();

    expect(workflowIds).toEqual(moduleIds);
  });

  it('gives every non-dashboard module operational depth', () => {
    for (const module of vendorOSModules.filter((item) => item.id !== 'dashboard')) {
      const workflow = vendorOSWorkflows[module.id];

      expect(workflow.kpis.length).toBeGreaterThanOrEqual(3);
      expect(workflow.lanes.length).toBeGreaterThanOrEqual(3);
      expect(workflow.records.length).toBeGreaterThanOrEqual(2);
      expect(workflow.primaryActions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('includes the requested core business systems', () => {
    expect(vendorOSWorkflows.crm.title).toBe('CRM');
    expect(vendorOSWorkflows.pms.title).toBe('Property Management System');
    expect(vendorOSWorkflows.tours.title).toBe('Tour Operator System');
    expect(vendorOSWorkflows.activities.title).toBe('Activity Management System');
    expect(vendorOSWorkflows.fleet.title).toBe('Fleet Management System');
    expect(vendorOSWorkflows.ai_assistant.title).toBe('AI Operations Assistant');
  });
});
