import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToursActivitiesWorkspace } from './ToursActivitiesWorkspace';

describe('ToursActivitiesWorkspace', () => {
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
});
