import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIAssistantWorkspace } from './AIAssistantWorkspace';

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

describe('AIAssistantWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Generated morning brief',
          recommendation: 'Prioritize housekeeping for six rooms before 2 PM arrivals.',
          confidence: 84,
          status: 'review',
        }),
      }),
    );
  });

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

  it('creates an AI insight through the assistant workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'insight-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<AIAssistantWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Insight title *'), 'Weekend revenue brief');
    await userEvent.type(screen.getByLabelText('Recommendation *'), 'Raise Goa villa prices by 12% for Saturday inventory.');
    await userEvent.type(screen.getByLabelText('Confidence'), '86');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'review');
    await userEvent.click(screen.getByRole('button', { name: 'Create AI Insight' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Weekend revenue brief',
      recommendation: 'Raise Goa villa prices by 12% for Saturday inventory.',
      confidence: 86,
      status: 'review',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live AI insight records when available', () => {
    hookMocks.records = [
      {
        id: 'insight-1',
        organization_id: 'org-1',
        title: 'Weekend revenue brief',
        recommendation: 'Raise Goa villa prices by 12% for Saturday inventory.',
        confidence: 86,
        status: 'review',
      },
    ];

    render(<AIAssistantWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Weekend revenue brief')).toBeInTheDocument();
    expect(screen.getByText('Raise Goa villa prices by 12% for Saturday inventory.')).toBeInTheDocument();
    expect(screen.getByText('86% confidence')).toBeInTheDocument();
  });

  it('generates an AI brief and saves it as an auditable insight', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'insight-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<AIAssistantWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate Brief' }));

    expect(fetch).toHaveBeenCalledWith(
      '/api/vendor-os/ai/brief',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"organizationId":"org-1"'),
      }),
    );
    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Generated morning brief',
      recommendation: 'Prioritize housekeeping for six rooms before 2 PM arrivals.',
      confidence: 84,
      status: 'review',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });
});
