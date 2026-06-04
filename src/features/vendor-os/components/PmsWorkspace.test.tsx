import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PmsWorkspace } from './PmsWorkspace';

describe('PmsWorkspace', () => {
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
});
