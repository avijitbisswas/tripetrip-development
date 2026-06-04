import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';

describe('AnalyticsWorkspace', () => {
  it('renders executive reports, branch comparison, category performance, operational KPIs, and exports', () => {
    render(<AnalyticsWorkspace />);

    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument();
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
    expect(screen.getByText('Branch Comparison')).toBeInTheDocument();
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
    expect(screen.getByText('Operational KPIs')).toBeInTheDocument();
    expect(screen.getByText('Export Center')).toBeInTheDocument();
    expect(screen.getByText('Goa Branch')).toBeInTheDocument();
    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByText('Compare Branches')).toBeInTheDocument();
  });
});
