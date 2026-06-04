import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AIAssistantWorkspace } from './AIAssistantWorkspace';

describe('AIAssistantWorkspace', () => {
  it('renders daily brief, risk alerts, reply drafts, pricing, automation, and approval controls', () => {
    render(<AIAssistantWorkspace />);

    expect(screen.getByText('AI Operations Assistant')).toBeInTheDocument();
    expect(screen.getByText('Daily Brief')).toBeInTheDocument();
    expect(screen.getAllByText('Risk Alerts')).toHaveLength(2);
    expect(screen.getByText('Reply Drafts')).toBeInTheDocument();
    expect(screen.getByText('Pricing Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Automation Queue')).toBeInTheDocument();
    expect(screen.getByText('Human Approval')).toBeInTheDocument();
    expect(screen.getByText('Generate Brief')).toBeInTheDocument();
    expect(screen.getByText('Draft Reply')).toBeInTheDocument();
  });
});
