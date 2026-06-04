import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarInventoryWorkspace } from './CalendarInventoryWorkspace';

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

describe('CalendarInventoryWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders the unified calendar and inventory controls', () => {
    render(<CalendarInventoryWorkspace />);

    expect(screen.getByText('Calendar + Live Inventory')).toBeInTheDocument();
    expect(screen.getByText('Unified Availability Board')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getAllByText('Capacity Risk').length).toBeGreaterThan(0);
    expect(screen.getByText('Block Dates')).toBeInTheDocument();
    expect(screen.getByText('Sync Marketplace')).toBeInTheDocument();
  });

  it('shows inventory lanes for PMS, tours, activities, and fleet', () => {
    render(<CalendarInventoryWorkspace />);

    expect(screen.getByText('PMS Rooms')).toBeInTheDocument();
    expect(screen.getByText('Tour Departures')).toBeInTheDocument();
    expect(screen.getByText('Activity Slots')).toBeInTheDocument();
    expect(screen.getByText('Fleet Availability')).toBeInTheDocument();
    expect(screen.getByText('Manali Hotel')).toBeInTheDocument();
    expect(screen.getByText('Scuba Diving')).toBeInTheDocument();
  });

  it('creates a live calendar event through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'event-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<CalendarInventoryWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Event title *'), 'Goa villa blackout');
    await userEvent.selectOptions(screen.getByLabelText('Event type *'), 'blackout');
    await userEvent.type(screen.getByLabelText('Starts at *'), '2026-06-10T10:30');
    await userEvent.type(screen.getByLabelText('Capacity'), '4');
    await userEvent.click(screen.getByRole('button', { name: 'Create Event' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Goa villa blackout',
      event_type: 'blackout',
      starts_at: '2026-06-10T10:30',
      capacity: 4,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live calendar records when available', () => {
    hookMocks.records = [
      {
        id: 'event-1',
        organization_id: 'org-1',
        title: 'Dubai departure hold',
        event_type: 'departure',
        starts_at: '2026-06-11T09:00:00.000Z',
        capacity: 18,
        status: 'scheduled',
      },
    ];

    render(<CalendarInventoryWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Dubai departure hold')).toBeInTheDocument();
    expect(screen.getAllByText('departure').length).toBeGreaterThan(0);
    expect(screen.getByText('18 capacity')).toBeInTheDocument();
  });
});
