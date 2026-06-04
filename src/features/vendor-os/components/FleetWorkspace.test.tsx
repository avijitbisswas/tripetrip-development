import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FleetWorkspace } from './FleetWorkspace';

describe('FleetWorkspace', () => {
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
});
