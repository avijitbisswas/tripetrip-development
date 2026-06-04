import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PmsWorkspace } from './PmsWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
}));

vi.mock('../hooks', () => ({
  useVendorOSRecords: () => ({
    records: hookMocks.records,
    loading: false,
    error: null,
    refresh: hookMocks.refresh,
  }),
  useVendorOSRecordMutations: () => ({
    createRecord: hookMocks.createRecord,
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    submitting: false,
    error: null,
  }),
}));

describe('PmsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders the PMS front desk and room grid', () => {
    render(<PmsWorkspace />);

    expect(screen.getByText('Property Management System')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Command')).toBeInTheDocument();
    expect(screen.getByText('Room Grid')).toBeInTheDocument();
    expect(screen.getAllByText('Room 204').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Villa 3').length).toBeGreaterThan(0);
    expect(screen.getByText('Check In Guest')).toBeInTheDocument();
  });

  it('renders arrivals, housekeeping, guest documents, and folio controls', () => {
    render(<PmsWorkspace />);

    expect(screen.getByText('Arrivals & Departures')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping Board')).toBeInTheDocument();
    expect(screen.getByText('Guest Documents')).toBeInTheDocument();
    expect(screen.getByText('Folio & Rates')).toBeInTheDocument();
    expect(screen.getAllByText('Aarav Mehta').length).toBeGreaterThan(0);
    expect(screen.getByText('Room 108 deep clean')).toBeInTheDocument();
  });

  it('creates a property through the PMS workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'property-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Property name *'), 'Goa Luxe Villas');
    await userEvent.selectOptions(screen.getByLabelText('Property type *'), 'villa');
    await userEvent.type(screen.getByLabelText('Address'), 'Candolim Beach Road');
    await userEvent.click(screen.getByRole('button', { name: 'Create Property' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      name: 'Goa Luxe Villas',
      property_type: 'villa',
      address: 'Candolim Beach Road',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live property records when available', () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Goa Luxe Villas')).toBeInTheDocument();
    expect(screen.getAllByText('villa').length).toBeGreaterThan(0);
    expect(screen.getByText('Candolim Beach Road')).toBeInTheDocument();
  });
});
