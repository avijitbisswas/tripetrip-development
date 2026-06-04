import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SubscriptionWorkspace } from './SubscriptionWorkspace';

describe('SubscriptionWorkspace', () => {
  it('renders plan, usage, add-ons, billing, entitlements, and upgrade controls', () => {
    render(<SubscriptionWorkspace />);

    expect(screen.getByText('Subscription Management')).toBeInTheDocument();
    expect(screen.getByText('Plan Control')).toBeInTheDocument();
    expect(screen.getByText('Usage Metering')).toBeInTheDocument();
    expect(screen.getByText('Add-ons & Limits')).toBeInTheDocument();
    expect(screen.getByText('Branch Entitlements')).toBeInTheDocument();
    expect(screen.getByText('Billing Events')).toBeInTheDocument();
    expect(screen.getByText('Growth Plan')).toBeInTheDocument();
    expect(screen.getByText('Change Plan')).toBeInTheDocument();
    expect(screen.getByText('Add Seats')).toBeInTheDocument();
  });
});
