import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FleetWorkspace } from './FleetWorkspace';

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

describe('FleetWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders dispatch, driver, maintenance, compliance, and manifest controls', () => {
    render(<FleetWorkspace />);

    expect(screen.getByText('Fleet Management System')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Command')).toBeInTheDocument();
    expect(screen.getByText('Driver Duty Board')).toBeInTheDocument();
    expect(screen.getByText('Maintenance & Fuel')).toBeInTheDocument();
    expect(screen.getByText('Permit Compliance')).toBeInTheDocument();
    expect(screen.getByText('Trip Manifest')).toBeInTheDocument();
    expect(screen.getByText('Toyota Innova')).toBeInTheDocument();
    expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
  });

  it('creates a vehicle through the fleet workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'vehicle-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<FleetWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Vehicle name *'), 'Mahindra Scorpio');
    await userEvent.selectOptions(screen.getByLabelText('Vehicle type *'), 'suv');
    await userEvent.type(screen.getByLabelText('Registration number'), 'GA01AB1234');
    await userEvent.type(screen.getByLabelText('Seats'), '7');
    await userEvent.click(screen.getByRole('button', { name: 'Create Vehicle' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      name: 'Mahindra Scorpio',
      vehicle_type: 'suv',
      registration_number: 'GA01AB1234',
      seats: 7,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live vehicle records when available', () => {
    hookMocks.records = [
      {
        id: 'vehicle-1',
        organization_id: 'org-1',
        name: 'Mahindra Scorpio',
        vehicle_type: 'suv',
        registration_number: 'GA01AB1234',
        seats: 7,
        status: 'available',
      },
    ];

    render(<FleetWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Mahindra Scorpio')).toBeInTheDocument();
    expect(screen.getByText('7 seats')).toBeInTheDocument();
    expect(screen.getByText('GA01AB1234')).toBeInTheDocument();
  });
});
