import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CrmInboxWorkspace } from './CrmInboxWorkspace';

describe('CrmInboxWorkspace', () => {
  it('renders CRM pipeline stages, leads, and follow-up queue', () => {
    render(<CrmInboxWorkspace mode="crm" />);

    expect(screen.getByText('CRM Command Center')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('Quote Sent')).toBeInTheDocument();
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
    expect(screen.getByText('Follow-up Queue')).toBeInTheDocument();
    expect(screen.getByText('Send Goa villa quote')).toBeInTheDocument();
  });

  it('renders inbox conversations and reply tools', () => {
    render(<CrmInboxWorkspace mode="inbox" />);

    expect(screen.getByText('Inbox Command Center')).toBeInTheDocument();
    expect(screen.getByText('Traveler Inbox')).toBeInTheDocument();
    expect(screen.getByText('Goa booking question')).toBeInTheDocument();
    expect(screen.getAllByText('AI Reply Draft').length).toBeGreaterThan(0);
    expect(screen.getByText('Assign Thread')).toBeInTheDocument();
  });
});
