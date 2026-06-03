import type { VendorOSModule } from '../types';

export const moduleContent: Record<VendorOSModule, { title: string; subtitle: string; bullets: string[] }> = {
  dashboard: {
    title: 'Operating Overview',
    subtitle: 'A command center for daily travel business decisions.',
    bullets: ['Live branch context', 'Role-aware actions', 'Notifications, documents, and audit activity'],
  },
  crm: {
    title: 'CRM',
    subtitle: 'Manage leads, guests, customer notes, and follow-ups.',
    bullets: ['Lead pipeline', 'Guest profiles', 'Follow-up tasks'],
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Unify availability, bookings, room status, vehicle slots, and departures.',
    bullets: ['Capacity calendar', 'Booking timeline', 'Blocked dates'],
  },
  inbox: {
    title: 'Inbox',
    subtitle: 'Centralize traveler, supplier, and internal conversations.',
    bullets: ['Booking-linked messages', 'Assignment queue', 'Fast replies'],
  },
  accounting: {
    title: 'Accounting',
    subtitle: 'Track money across invoices, payouts, expenses, and taxes.',
    bullets: ['Ledger foundation', 'Invoices and expenses', 'Payout visibility'],
  },
  team: {
    title: 'Team Management',
    subtitle: 'Invite staff, assign roles, and control branch-level access.',
    bullets: ['Role-based access', 'Branch assignment', 'Invitation tracking'],
  },
  pms: {
    title: 'PMS',
    subtitle: 'Operate properties, rooms, check-ins, housekeeping, and guest documents.',
    bullets: ['Room inventory', 'Daily arrivals', 'Housekeeping states'],
  },
  tours: {
    title: 'Tour Operator System',
    subtitle: 'Run departures, itineraries, guide rosters, and group manifests.',
    bullets: ['Departure control', 'Guide assignment', 'Traveler manifests'],
  },
  activities: {
    title: 'Activity Management',
    subtitle: 'Manage slots, safety, equipment, waivers, and adventure operations.',
    bullets: ['Slot capacity', 'Safety logs', 'Equipment readiness'],
  },
  fleet: {
    title: 'Fleet Management',
    subtitle: 'Operate vehicles, drivers, maintenance, fuel, and permit documents.',
    bullets: ['Vehicle registry', 'Driver assignment', 'Maintenance alerts'],
  },
  ai_assistant: {
    title: 'AI Operations Assistant',
    subtitle: 'Turn operational signals into recommended actions.',
    bullets: ['Pricing suggestions', 'Reply drafts', 'Risk and task alerts'],
  },
  marketplace: {
    title: 'Marketplace Listing Management',
    subtitle: 'Sync internal inventory with Tripetrip listings, deals, and direct bookings.',
    bullets: ['Listing health', 'Direct deals', 'Conversion tracking'],
  },
  subscriptions: {
    title: 'Subscription Management',
    subtitle: 'Manage plans, usage, limits, and billing status.',
    bullets: ['Plan status', 'Usage metering', 'Add-on readiness'],
  },
  analytics: {
    title: 'Analytics & Reporting',
    subtitle: 'Measure revenue, conversion, occupancy, and branch performance.',
    bullets: ['Revenue reports', 'Category performance', 'Export-ready metrics'],
  },
  branches: {
    title: 'Multi-branch Support',
    subtitle: 'Control properties, depots, offices, and destination desks.',
    bullets: ['Branch registry', 'Category mix', 'Local managers'],
  },
  documents: {
    title: 'Document Management',
    subtitle: 'Store KYC, permits, insurance, contracts, guest docs, and vouchers.',
    bullets: ['Expiry tracking', 'Module-linked files', 'Compliance-ready vault'],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure organization profile, modules, integrations, and operating policies.',
    bullets: ['Business profile', 'Module controls', 'Integration settings'],
  },
};
