import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

vi.mock('../hooks', () => ({
  useVendorOSTenant: () => ({
    selectedOrganization: { id: 'org-1', name: 'Himalayan Escape Group' },
    branches: [{ id: 'branch-1', name: 'Manali Hotel' }],
    activeBranch: { id: 'branch-1', name: 'Manali Hotel' },
    role: 'staff',
    can: (module: string, action = 'view') => {
      if (module === 'accounting' || module === 'subscriptions') return false;
      return action === 'view' || action === 'update';
    },
    loading: false,
    error: null,
  }),
  useVendorOSNotifications: () => ({
    notifications: [{ id: 'note-1', title: 'New booking', status: 'unread', created_at: '2026-06-03T00:00:00.000Z' }],
    unreadCount: 1,
    loading: false,
  }),
  useVendorOSAuditLogs: () => [
    {
      id: 'audit-1',
      module: 'calendar',
      action: 'booking.created',
      severity: 'info',
      created_at: '2026-06-03T00:00:00.000Z',
    },
  ],
  useVendorOSDocuments: () => [
    {
      id: 'doc-1',
      name: 'Hotel Trade License',
      document_type: 'license',
      status: 'active',
      created_at: '2026-06-03T00:00:00.000Z',
    },
  ],
}));

describe('Vendor OS dashboard', () => {
  it('renders the operating system shell and staff-safe modules', () => {
    render(
      <MemoryRouter>
        <Dashboard initialUserId="user-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Tripetrip Vendor OS')).toBeInTheDocument();
    expect(screen.getByText('Himalayan Escape Group')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getAllByText('Calendar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PMS').length).toBeGreaterThan(0);
    expect(screen.queryByText('Accounting')).not.toBeInTheDocument();
    expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument();
    expect(screen.getByText('Hotel Trade License')).toBeInTheDocument();
  });
});
