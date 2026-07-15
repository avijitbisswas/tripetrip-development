import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIAssistantWorkspace } from './AIAssistantWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  aiRecords: [] as Record<string, unknown>[],
  marketplaceRecords: [] as Record<string, unknown>[],
}));

const apiMocks = vi.hoisted(() => ({
  listVendorPmsRecords: vi.fn(),
  listVendorAccountingRecords: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useVendorOSRecords: (module: string) => ({
    records: module === 'marketplace' ? hookMocks.marketplaceRecords : hookMocks.aiRecords,
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

vi.mock('../api', () => ({
  listVendorPmsRecords: apiMocks.listVendorPmsRecords,
  listVendorAccountingRecords: apiMocks.listVendorAccountingRecords,
}));

describe('AIAssistantWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.aiRecords = [];
    hookMocks.marketplaceRecords = [];
    apiMocks.listVendorPmsRecords.mockReset();
    apiMocks.listVendorAccountingRecords.mockReset();
    vi.setSystemTime(new Date('2026-07-15T09:00:00.000Z'));
    apiMocks.listVendorPmsRecords.mockImplementation(async (resource: string) => {
      if (resource === 'reservations') {
        return [
          {
            id: 'reservation-1',
            organization_id: 'org-1',
            branch_id: 'branch-1',
            property_id: 'property-1',
            room_id: 'room-101',
            guest_name: 'Aarav',
            guest_email: null,
            guest_phone: null,
            check_in_date: '2026-07-15',
            check_out_date: '2026-07-16',
            adults: 2,
            children: 0,
            status: 'reserved',
            payment_status: 'pending',
            total_amount: 7600,
            source: 'manual',
            notes: null,
            created_at: '2026-07-15T08:00:00.000Z',
          },
        ];
      }

      if (resource === 'rooms') {
        return [
          {
            id: 'room-101',
            organization_id: 'org-1',
            property_id: 'property-1',
            room_type_id: 'room-type-1',
            room_number: '101',
            floor: '1',
            status: 'available',
            housekeeping_status: 'dirty',
            metadata: {},
            created_at: '2026-07-15T08:00:00.000Z',
          },
        ];
      }

      if (resource === 'folio_entries') {
        return [
          {
            id: 'folio-1',
            organization_id: 'org-1',
            branch_id: 'branch-1',
            property_id: 'property-1',
            reservation_id: 'reservation-1',
            entry_type: 'room_charge',
            title: 'Ocean Suite',
            amount: 7600,
            quantity: 1,
            payment_state: 'open',
            notes: null,
            posted_at: '2026-07-15T08:00:00.000Z',
            created_at: '2026-07-15T08:00:00.000Z',
          },
        ];
      }

      return [];
    });
    apiMocks.listVendorAccountingRecords.mockResolvedValue([
      {
        id: 'payment-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        reservation_id: 'reservation-1',
        folio_entry_id: 'folio-1',
        manual_payment_intent_id: null,
        payment_method: 'upi',
        amount: 3000,
        status: 'pending',
        reference_number: 'UPI-1',
        collected_at: '2026-07-15T08:15:00.000Z',
        collected_by: null,
        notes: null,
        created_at: '2026-07-15T08:15:00.000Z',
      },
    ]);
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

  afterEach(() => {
    vi.useRealTimers();
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
    hookMocks.aiRecords = [
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

  it('derives live operational AI signals from PMS, accounting, and marketplace data', async () => {
    hookMocks.marketplaceRecords = [
      {
        id: 'sync-1',
        organization_id: 'org-1',
        sync_status: 'failed',
        metadata: {
          listing_title: 'Private Villa Goa',
          approval_status: 'pending',
        },
      },
    ];

    render(<AIAssistantWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText(/payments awaiting review/i)).toBeInTheDocument();
    expect(screen.getByText(/rooms are not clean for active or incoming stays/i)).toBeInTheDocument();
    expect(screen.getByText(/open folios can trigger payment reminders before checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/failed syncs and 1 approval-gated listing changes are waiting/i)).toBeInTheDocument();
  });
});
