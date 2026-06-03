import type { VendorOSModule } from './types';

export interface VendorOSKpi {
  label: string;
  value: string;
  trend: string;
}

export interface VendorOSLane {
  title: string;
  description: string;
  status: 'live' | 'attention' | 'planned';
}

export interface VendorOSRecord {
  title: string;
  meta: string;
  value: string;
  status: string;
}

export interface VendorOSWorkflow {
  title: string;
  subtitle: string;
  kpis: VendorOSKpi[];
  lanes: VendorOSLane[];
  records: VendorOSRecord[];
  primaryActions: string[];
}

const standardKpis = (first: string, second: string, third: string): VendorOSKpi[] => [
  { label: first, value: 'Live', trend: 'Synced' },
  { label: second, value: 'Today', trend: 'Priority' },
  { label: third, value: 'Ready', trend: 'Tracked' },
];

const lanes = (items: Array<[string, string, VendorOSLane['status']]>): VendorOSLane[] =>
  items.map(([title, description, status]) => ({ title, description, status }));

const records = (items: Array<[string, string, string, string]>): VendorOSRecord[] =>
  items.map(([title, meta, value, status]) => ({ title, meta, value, status }));

export const vendorOSWorkflows: Record<VendorOSModule, VendorOSWorkflow> = {
  dashboard: {
    title: 'Operating Overview',
    subtitle: 'Daily command center across branches, teams, inventory, revenue, and marketplace performance.',
    kpis: standardKpis('Modules', 'Alerts', 'Branches'),
    lanes: lanes([
      ['Morning Control', 'Review arrivals, departures, tasks, and team coverage.', 'live'],
      ['Revenue Pulse', 'Monitor direct bookings, unpaid invoices, and payout risks.', 'live'],
      ['Marketplace Health', 'Keep listings, deals, and inventory sync in one view.', 'attention'],
    ]),
    records: records([
      ['Operations Brief', 'All branches', '18 tasks', 'Live'],
      ['Revenue Watch', 'Accounting', 'INR 2.8L', 'Review'],
    ]),
    primaryActions: ['Open daily brief', 'Create operations task'],
  },
  crm: {
    title: 'CRM',
    subtitle: 'Lead pipeline, guest profiles, customer notes, follow-ups, and sales conversion workflows.',
    kpis: [
      { label: 'Open Leads', value: '48', trend: '+12 this week' },
      { label: 'Follow-ups Due', value: '9', trend: 'Today' },
      { label: 'Repeat Guests', value: '31%', trend: '+6%' },
    ],
    lanes: lanes([
      ['Lead Capture', 'Collect marketplace, website, phone, and referral inquiries.', 'live'],
      ['Sales Pipeline', 'Qualify, quote, follow up, and convert trip requests.', 'live'],
      ['Guest Memory', 'Store preferences, documents, notes, and service history.', 'attention'],
    ]),
    records: records([
      ['Aarav Mehta', 'Goa villa inquiry', 'INR 42,000', 'Quote sent'],
      ['Priya Sen', 'Kerala family package', '4 travelers', 'Follow-up due'],
      ['Rahul Jain', 'Dubai weekend', 'Hot lead', 'New'],
    ]),
    primaryActions: ['Add lead', 'Create follow-up', 'Send quote'],
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Unified operational calendar for stays, rooms, tours, activities, vehicles, and blackout dates.',
    kpis: [
      { label: 'Events Today', value: '42', trend: '8 branches' },
      { label: 'Capacity Risk', value: '6', trend: 'Needs action' },
      { label: 'Blackouts', value: '3', trend: 'Upcoming' },
    ],
    lanes: lanes([
      ['Availability Grid', 'View inventory by branch, module, and date.', 'live'],
      ['Capacity Control', 'Adjust slots, rooms, guides, and vehicles.', 'attention'],
      ['Schedule Sync', 'Push changes to Tripetrip marketplace listings.', 'planned'],
    ]),
    records: records([
      ['Manali Hotel', 'Rooms and housekeeping', '83% occupancy', 'Live'],
      ['ATV Adventure', 'Activity slots', '12 seats left', 'Selling'],
      ['Airport SUV Fleet', 'Transport assignments', '4 vehicles free', 'Ready'],
    ]),
    primaryActions: ['Block dates', 'Adjust capacity', 'Open today view'],
  },
  inbox: {
    title: 'Inbox',
    subtitle: 'Unified traveler, guest, supplier, and internal team conversations linked to bookings and leads.',
    kpis: [
      { label: 'Open Threads', value: '27', trend: '7 urgent' },
      { label: 'Avg Reply Time', value: '8m', trend: '-22%' },
      { label: 'Assigned', value: '19', trend: 'Team queue' },
    ],
    lanes: lanes([
      ['Traveler Conversations', 'Reply to booking, lead, and service questions.', 'live'],
      ['Team Assignments', 'Route messages to sales, ops, accounting, or branch staff.', 'live'],
      ['Templates', 'Use saved replies and AI-generated drafts.', 'planned'],
    ]),
    records: records([
      ['Goa booking question', 'Traveler chat', '2 unread', 'Urgent'],
      ['Vendor payout query', 'Internal note', 'Accounting', 'Assigned'],
      ['Airport pickup update', 'Transport', 'ETA requested', 'Open'],
    ]),
    primaryActions: ['Reply now', 'Assign thread', 'Create template'],
  },
  accounting: {
    title: 'Accounting',
    subtitle: 'Invoices, payouts, expenses, commissions, taxes, ledger, and branch-level financial reporting.',
    kpis: [
      { label: 'Receivables', value: 'INR 4.2L', trend: '12 invoices' },
      { label: 'Expenses', value: 'INR 82K', trend: 'This month' },
      { label: 'Payouts', value: 'INR 2.1L', trend: 'Pending' },
    ],
    lanes: lanes([
      ['Invoices', 'Create, send, reconcile, and export invoices.', 'live'],
      ['Expense Desk', 'Track supplier, fuel, payroll, and permit costs.', 'attention'],
      ['Ledger', 'Map bookings, payouts, commissions, and taxes.', 'planned'],
    ]),
    records: records([
      ['INV-2048', 'Goa Beach Escape', 'INR 29,999', 'Due'],
      ['Fuel Expense', 'Fleet depot', 'INR 12,400', 'Approved'],
      ['Tripetrip Payout', 'Marketplace', 'INR 1.2L', 'Processing'],
    ]),
    primaryActions: ['Create invoice', 'Add expense', 'Export ledger'],
  },
  team: {
    title: 'Team Management',
    subtitle: 'Staff directory, invitations, roles, permissions, branch assignment, and accountability.',
    kpis: [
      { label: 'Active Users', value: '19', trend: '5 roles' },
      { label: 'Pending Invites', value: '3', trend: 'Needs follow-up' },
      { label: 'Branch Managers', value: '4', trend: 'Covered' },
    ],
    lanes: lanes([
      ['Role Access', 'Assign owner, admin, manager, operations, sales, accountant, staff, or viewer.', 'live'],
      ['Branch Staffing', 'Control who works at each property, depot, office, or activity base.', 'live'],
      ['Audit Accountability', 'Tie actions to team members and roles.', 'attention'],
    ]),
    records: records([
      ['Neha Kapoor', 'Manali Hotel', 'Manager', 'Active'],
      ['Amit Das', 'Fleet depot', 'Operations', 'Active'],
      ['Riya Shah', 'Sales desk', 'Invite sent', 'Pending'],
    ]),
    primaryActions: ['Invite member', 'Assign role', 'Review access'],
  },
  pms: {
    title: 'Property Management System',
    subtitle: 'Properties, room types, rooms, rates, housekeeping, check-ins, folios, and guest documents.',
    kpis: [
      { label: 'Occupancy', value: '83%', trend: '+9%' },
      { label: 'Arrivals', value: '14', trend: 'Today' },
      { label: 'Rooms Dirty', value: '6', trend: 'Housekeeping' },
    ],
    lanes: lanes([
      ['Front Desk', 'Arrivals, departures, guest documents, and room assignment.', 'live'],
      ['Housekeeping', 'Clean, inspect, repair, and release room inventory.', 'attention'],
      ['Rates And Folios', 'Direct rates, charges, balances, and settlement.', 'planned'],
    ]),
    records: records([
      ['Room 204', 'Deluxe Sea View', 'Check-in 2 PM', 'Ready'],
      ['Room 108', 'Garden Suite', 'Checkout pending', 'Dirty'],
      ['Villa 3', 'Goa private villa', 'INR 18,000/night', 'Occupied'],
    ]),
    primaryActions: ['Check in guest', 'Assign room', 'Update housekeeping'],
  },
  tours: {
    title: 'Tour Operator System',
    subtitle: 'Itineraries, departures, guide rosters, pickup points, supplier tasks, and group manifests.',
    kpis: [
      { label: 'Departures', value: '12', trend: 'This week' },
      { label: 'Guides Assigned', value: '18', trend: 'Ready' },
      { label: 'Manifest Gaps', value: '2', trend: 'Fix today' },
    ],
    lanes: lanes([
      ['Itinerary Builder', 'Create day-wise plans, inclusions, suppliers, and pricing.', 'live'],
      ['Departure Control', 'Manage dates, capacity, pickup points, guides, and guests.', 'attention'],
      ['DMC Operations', 'Coordinate hotels, transfers, activities, and local teams.', 'planned'],
    ]),
    records: records([
      ['Kerala Backwaters', '3D/2N departure', '18 guests', 'Guide assigned'],
      ['Dubai Weekend', 'Supplier coordination', '6 rooms', 'Confirming'],
      ['Bali Escape', 'International package', '12 guests', 'Docs pending'],
    ]),
    primaryActions: ['Create itinerary', 'Schedule departure', 'Export manifest'],
  },
  activities: {
    title: 'Activity Management System',
    subtitle: 'Activity slots, safety logs, gear inventory, waivers, instructors, and capacity management.',
    kpis: [
      { label: 'Slots Selling', value: '31', trend: 'Live' },
      { label: 'Safety Logs', value: '4', trend: 'Due' },
      { label: 'Gear Ready', value: '92%', trend: 'Checked' },
    ],
    lanes: lanes([
      ['Slot Control', 'Open, close, price, and cap activity sessions.', 'live'],
      ['Safety Desk', 'Track checks, waivers, guide certifications, and incident notes.', 'attention'],
      ['Equipment', 'Manage gear assignment, condition, and maintenance.', 'live'],
    ]),
    records: records([
      ['Scuba Diving', 'Andaman Islands', '8 seats left', 'Selling'],
      ['ATV Adventure', 'Rishikesh', 'Safety checklist', 'Due'],
      ['Paragliding', 'Bir Billing', 'Wind hold', 'Attention'],
    ]),
    primaryActions: ['Create slot', 'Log safety check', 'Assign gear'],
  },
  fleet: {
    title: 'Fleet Management System',
    subtitle: 'Vehicles, drivers, assignments, permits, fuel logs, maintenance, and trip manifests.',
    kpis: [
      { label: 'Vehicles Active', value: '24', trend: '4 free' },
      { label: 'Drivers On Duty', value: '18', trend: 'Covered' },
      { label: 'Maintenance Due', value: '5', trend: 'This week' },
    ],
    lanes: lanes([
      ['Dispatch Board', 'Assign vehicles and drivers to bookings or internal trips.', 'live'],
      ['Maintenance', 'Track service, repairs, mileage, and downtime.', 'attention'],
      ['Compliance', 'Store permits, insurance, driver documents, and expiry alerts.', 'live'],
    ]),
    records: records([
      ['Toyota Innova', 'Airport transfer', 'INR 2,299/day', 'Assigned'],
      ['Luxury SUV', 'Goa rental', 'Service due', 'Attention'],
      ['Tempo Traveller', 'Group tour', '12 seats', 'Available'],
    ]),
    primaryActions: ['Assign vehicle', 'Add fuel log', 'Schedule service'],
  },
  ai_assistant: {
    title: 'AI Operations Assistant',
    subtitle: 'AI-generated daily brief, pricing suggestions, reply drafts, risk alerts, and workflow recommendations.',
    kpis: [
      { label: 'Insights', value: '8', trend: 'Today' },
      { label: 'Draft Replies', value: '14', trend: 'Ready' },
      { label: 'Revenue Ideas', value: '5', trend: 'High impact' },
    ],
    lanes: lanes([
      ['Daily Brief', 'Summarize arrivals, risks, revenue, complaints, and open tasks.', 'live'],
      ['Smart Replies', 'Draft responses for leads, guests, and suppliers.', 'planned'],
      ['Pricing Signals', 'Recommend direct rates, deals, and capacity controls.', 'attention'],
    ]),
    records: records([
      ['Raise Goa villa weekend price', 'Demand spike', '+12% suggested', 'Review'],
      ['Reply draft for airport pickup', 'Inbox', 'Ready', 'Drafted'],
      ['Housekeeping risk', 'PMS', '6 dirty rooms', 'Urgent'],
    ]),
    primaryActions: ['Generate brief', 'Draft reply', 'Review pricing'],
  },
  marketplace: {
    title: 'Marketplace Listing Management',
    subtitle: 'Tripetrip listing sync, deal management, direct-booking discounts, inventory mapping, and conversion health.',
    kpis: [
      { label: 'Listings Live', value: '24', trend: 'Synced' },
      { label: 'Deals Active', value: '9', trend: 'Flash sale' },
      { label: 'Conversion', value: '7.8%', trend: '+1.4%' },
    ],
    lanes: lanes([
      ['Listing Sync', 'Map rooms, tours, activities, and vehicles to Tripetrip marketplace cards.', 'live'],
      ['Direct Deals', 'Publish last-minute, seasonal, festival, and inventory-driven offers.', 'attention'],
      ['Performance', 'Track search visibility, saves, bookings, and direct savings.', 'live'],
    ]),
    records: records([
      ['Goa Beach Escape', 'Limited-Time Direct Deal', '30% off', 'Live'],
      ['Kerala Houseboat', 'Stay listing', '4 rooms left', 'Synced'],
      ['Luxury SUV Rental', 'Transport listing', 'INR 2,299/day', 'Promoted'],
    ]),
    primaryActions: ['Sync listing', 'Create flash sale', 'Review conversion'],
  },
  subscriptions: {
    title: 'Subscription Management',
    subtitle: 'Vendor plan, billing status, usage limits, add-ons, branch entitlements, and upgrade controls.',
    kpis: [
      { label: 'Plan', value: 'Growth', trend: 'Active' },
      { label: 'Usage', value: '68%', trend: 'Healthy' },
      { label: 'Add-ons', value: '3', trend: 'Enabled' },
    ],
    lanes: lanes([
      ['Plan Control', 'Manage subscription plan, branch limits, users, and module access.', 'live'],
      ['Usage Metering', 'Track listings, bookings, AI credits, storage, and team seats.', 'planned'],
      ['Billing Events', 'Invoice subscription charges and renewal events.', 'attention'],
    ]),
    records: records([
      ['Growth Plan', 'Monthly subscription', 'INR 7,999', 'Active'],
      ['AI Credits', 'Assistant add-on', '820 left', 'Healthy'],
      ['Storage', 'Document vault', '68%', 'Monitor'],
    ]),
    primaryActions: ['Change plan', 'Add seats', 'View usage'],
  },
  analytics: {
    title: 'Analytics & Reporting',
    subtitle: 'Revenue, occupancy, conversion, category performance, branch comparisons, exports, and operational KPIs.',
    kpis: [
      { label: 'Revenue', value: 'INR 18.4L', trend: '+18%' },
      { label: 'Bookings', value: '1,204', trend: '+11%' },
      { label: 'Direct Savings', value: 'INR 3.2L', trend: 'Traveler value' },
    ],
    lanes: lanes([
      ['Executive Reports', 'Track revenue, bookings, branch performance, and conversion.', 'live'],
      ['Operational KPIs', 'Measure response time, occupancy, guide utilization, and fleet uptime.', 'live'],
      ['Exports', 'Download branch, category, accounting, and marketplace reports.', 'planned'],
    ]),
    records: records([
      ['Goa Branch', 'Top branch', 'INR 7.2L', '+24%'],
      ['Activities', 'Fastest growth', '31% conversion lift', 'Strong'],
      ['Transport', 'Fleet uptime', '94%', 'Healthy'],
    ]),
    primaryActions: ['Export report', 'Compare branches', 'Open revenue view'],
  },
  branches: {
    title: 'Multi-branch Support',
    subtitle: 'Properties, offices, activity bases, fleet depots, destination desks, and branch-level category controls.',
    kpis: [
      { label: 'Branches', value: '6', trend: 'Active' },
      { label: 'Categories', value: '10', trend: 'Hybrid ops' },
      { label: 'Managers', value: '5', trend: 'Assigned' },
    ],
    lanes: lanes([
      ['Branch Registry', 'Create and maintain business locations and destination desks.', 'live'],
      ['Category Mix', 'Enable PMS, tours, activities, fleet, and marketplace per branch.', 'live'],
      ['Local Controls', 'Assign managers, documents, policies, and operating settings.', 'attention'],
    ]),
    records: records([
      ['Manali Hotel', 'Hotel + tours', '83% occupancy', 'Active'],
      ['Goa Villa Desk', 'Property + transport', '9 listings', 'Active'],
      ['Rishikesh Base', 'Activities', '31 slots', 'Active'],
    ]),
    primaryActions: ['Add branch', 'Assign manager', 'Configure modules'],
  },
  documents: {
    title: 'Document Management',
    subtitle: 'KYC, permits, insurance, contracts, driver papers, guest documents, vouchers, and expiry alerts.',
    kpis: [
      { label: 'Documents', value: '124', trend: 'Stored' },
      { label: 'Expiring Soon', value: '7', trend: 'Attention' },
      { label: 'Verified', value: '92%', trend: 'Compliant' },
    ],
    lanes: lanes([
      ['Compliance Vault', 'Store vendor, branch, vehicle, activity, and property documents.', 'live'],
      ['Expiry Alerts', 'Notify managers before permits, insurance, and licenses expire.', 'attention'],
      ['Booking Docs', 'Attach guest IDs, vouchers, waivers, and manifests.', 'planned'],
    ]),
    records: records([
      ['Hotel Trade License', 'Manali Hotel', 'Expires Aug 2026', 'Active'],
      ['Vehicle Insurance', 'Luxury SUV', 'Expires in 21 days', 'Attention'],
      ['Scuba Waivers', 'Activity slot', '18 signed', 'Complete'],
    ]),
    primaryActions: ['Upload document', 'Review expiry', 'Link to record'],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Organization profile, branches, modules, policies, integrations, AI settings, and marketplace sync preferences.',
    kpis: [
      { label: 'Integrations', value: '5', trend: 'Connected' },
      { label: 'Policies', value: '12', trend: 'Configured' },
      { label: 'Modules', value: '17', trend: 'Enabled' },
    ],
    lanes: lanes([
      ['Business Profile', 'Legal details, branding, currency, timezone, and contact channels.', 'live'],
      ['Module Controls', 'Enable or restrict modules by organization, branch, and subscription.', 'live'],
      ['Integrations', 'Connect marketplace, payments, email, AI, storage, and analytics tools.', 'planned'],
    ]),
    records: records([
      ['Tripetrip Marketplace', 'Inventory sync', 'Connected', 'Live'],
      ['Razorpay', 'Payments', 'Configured', 'Active'],
      ['AI Assistant', 'Operations model', 'Draft mode', 'Review'],
    ]),
    primaryActions: ['Edit profile', 'Manage modules', 'Open integrations'],
  },
};
