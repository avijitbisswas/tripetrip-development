import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToursActivitiesWorkspace } from './ToursActivitiesWorkspace';

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

describe('ToursActivitiesWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders tour operator departures, guide roster, and manifests', () => {
    render(<ToursActivitiesWorkspace mode="tours" />);

    expect(screen.getByText('Tour Operator System')).toBeInTheDocument();
    expect(screen.getByText('Departure Control')).toBeInTheDocument();
    expect(screen.getByText('Guide Roster')).toBeInTheDocument();
    expect(screen.getByText('Group Manifest')).toBeInTheDocument();
    expect(screen.getAllByText('Kerala Backwaters')).toHaveLength(2);
    expect(screen.getByText('Export Manifest')).toBeInTheDocument();
  });

  it('renders activity slots, safety desk, and equipment readiness', () => {
    render(<ToursActivitiesWorkspace mode="activities" />);

    expect(screen.getByText('Activity Management System')).toBeInTheDocument();
    expect(screen.getByText('Slot Control')).toBeInTheDocument();
    expect(screen.getByText('Safety Desk')).toBeInTheDocument();
    expect(screen.getByText('Equipment Readiness')).toBeInTheDocument();
    expect(screen.getByText('Scuba Diving')).toBeInTheDocument();
    expect(screen.getByText('Log Safety Check')).toBeInTheDocument();
  });

  it('creates a tour itinerary through the live form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'tour-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<ToursActivitiesWorkspace mode="tours" organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Itinerary title *'), 'Ladakh Explorer');
    await userEvent.type(screen.getByLabelText('Duration days *'), '6');
    await userEvent.type(screen.getByLabelText('Base price'), '45999');
    await userEvent.click(screen.getByRole('button', { name: 'Create Itinerary' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Ladakh Explorer',
      duration_days: 6,
      base_price: 45999,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('creates an activity slot through the live form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'slot-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<ToursActivitiesWorkspace mode="activities" organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Activity slot *'), 'Sunset Kayaking');
    await userEvent.type(screen.getByLabelText('Starts at *'), '2026-06-12T17:30');
    await userEvent.type(screen.getByLabelText('Capacity *'), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Create Slot' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Sunset Kayaking',
      starts_at: '2026-06-12T17:30',
      capacity: 12,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live records for the active mode', () => {
    hookMocks.records = [
      {
        id: 'tour-1',
        organization_id: 'org-1',
        title: 'Ladakh Explorer',
        duration_days: 6,
        base_price: 45999,
        is_active: true,
      },
    ];

    render(<ToursActivitiesWorkspace mode="tours" organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Ladakh Explorer')).toBeInTheDocument();
    expect(screen.getByText('6 days')).toBeInTheDocument();
    expect(screen.getByText('INR 45,999')).toBeInTheDocument();
  });
});
