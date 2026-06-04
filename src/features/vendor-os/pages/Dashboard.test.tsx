import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  useVendorOSRecords: () => ({
    records: [],
    loading: false,
    error: null,
  }),
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

  it('renders a generic developed module workspace from the route', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/fleet']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Fleet Management System')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Board')).toBeInTheDocument();
    expect(screen.getByText('Toyota Innova')).toBeInTheDocument();
    expect(screen.getByText('Assign vehicle')).toBeInTheDocument();
    expect(screen.getByText('Backed by `vendor_vehicles`')).toBeInTheDocument();
    expect(screen.getByText('Vehicle name')).toBeInTheDocument();
  });

  it('renders the Tours module as a departure workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/tours']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Tour Operator System')).toBeInTheDocument();
    expect(screen.getByText('Departure Control')).toBeInTheDocument();
    expect(screen.getByText('Guide Roster')).toBeInTheDocument();
    expect(screen.getByText('Group Manifest')).toBeInTheDocument();
  });

  it('renders the Activities module as a safety and slots workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/activities']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Activity Management System')).toBeInTheDocument();
    expect(screen.getByText('Slot Control')).toBeInTheDocument();
    expect(screen.getByText('Safety Desk')).toBeInTheDocument();
    expect(screen.getByText('Equipment Readiness')).toBeInTheDocument();
  });

  it('renders the PMS module as a front desk workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/pms']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Front Desk Command')).toBeInTheDocument();
    expect(screen.getByText('Room Grid')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping Board')).toBeInTheDocument();
  });

  it('renders the CRM module as a deep workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/crm']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('CRM Command Center')).toBeInTheDocument();
    expect(screen.getByText('Quote Sent')).toBeInTheDocument();
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
  });

  it('renders the Calendar module as a live inventory workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/calendar']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Calendar + Live Inventory')).toBeInTheDocument();
    expect(screen.getByText('Unified Availability Board')).toBeInTheDocument();
    expect(screen.getByText('PMS Rooms')).toBeInTheDocument();
  });
});
