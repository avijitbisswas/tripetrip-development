import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalendarInventoryWorkspace } from './CalendarInventoryWorkspace';

describe('CalendarInventoryWorkspace', () => {
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
});
