# Vendor OS Foundation Design

## Purpose

Tripetrip will become the daily operating platform for travel businesses, not only a marketplace. The first phase builds the foundation for a multi-tenant Vendor Operating System that can later support CRM, PMS, tours, activities, fleet, accounting, AI operations, subscriptions, analytics, and marketplace listing sync.

This phase does not build every operational module in full. It creates the tenant model, permission system, audit trail, notifications, documents, shared UI shell, service boundaries, and route structure that every later module will use.

## Scope

### Included In Phase One

- Multi-tenant business entities owned by vendor users.
- Multi-branch support for hotels, resorts, homestays, agencies, DMCs, operators, and transport providers.
- Multi-category vendor capabilities, so one business can operate as property, tour, activity, fleet, and agency provider at the same time.
- Team membership and role-based access control.
- Permission definitions for every planned Vendor OS module.
- Audit logs for business-critical operations.
- Notification center foundation.
- Document management foundation.
- Vendor OS route shell at `/vendor/os`.
- API-first TypeScript service layer that wraps Supabase calls.
- React hooks for tenant context, permissions, notifications, and audit events.
- Initial dashboard data model with real Supabase integration where existing tables already support it.
- Roadmap for later module implementation.

### Deferred To Later Phases

- Full CRM records and pipelines.
- PMS rooms, folios, housekeeping, guest document verification, and rate plans.
- Tour departures, guide rosters, activity safety logs, and equipment inventory.
- Fleet vehicles, driver assignments, fuel, maintenance, and permits.
- Accounting ledger, tax reports, invoices, payouts, and commission logic.
- AI assistant calls to external model APIs.
- Subscription billing provider integration.
- Advanced realtime collaboration and presence.

## Product Model

A Tripetrip vendor user may own or work inside multiple business entities. Each business entity can have multiple branches. Each branch can support multiple operating categories.

Example:

- `Himalayan Escape Group`
  - Branch: `Manali Hotel`
    - Categories: Hotel, Resort, Activity Operator
  - Branch: `Goa Villa Desk`
    - Categories: Property Owner, Homestay, Transport Provider
  - Branch: `Bali DMC`
    - Categories: DMC, Tour Operator, Travel Agent

This model prevents the platform from being boxed into one vendor profile per user.

## Information Architecture

The first Vendor OS shell will expose these sections:

- Overview
- CRM
- Calendar
- Inbox
- Accounting
- Team
- PMS
- Tours
- Activities
- Fleet
- AI Assistant
- Marketplace
- Subscriptions
- Analytics
- Branches
- Documents
- Settings

Sections that are not fully implemented in phase one will show production-quality empty states, permission-aware navigation, and module readiness metadata. They will not fake completed business workflows.

## Database Schema

Phase one extends `supabase_schema.sql` with these tables and enums.

### Enums

- `vendor_business_category`
  - `property_owner`
  - `hotel`
  - `resort`
  - `homestay`
  - `hostel`
  - `travel_agent`
  - `tour_operator`
  - `dmc`
  - `adventure_operator`
  - `transport_provider`

- `vendor_os_role`
  - `owner`
  - `admin`
  - `manager`
  - `operations`
  - `sales`
  - `accountant`
  - `staff`
  - `viewer`

- `vendor_os_module`
  - `dashboard`
  - `crm`
  - `calendar`
  - `inbox`
  - `accounting`
  - `team`
  - `pms`
  - `tours`
  - `activities`
  - `fleet`
  - `ai_assistant`
  - `marketplace`
  - `subscriptions`
  - `analytics`
  - `branches`
  - `documents`
  - `settings`

- `permission_action`
  - `view`
  - `create`
  - `update`
  - `delete`
  - `approve`
  - `export`
  - `manage`

- `audit_event_severity`
  - `info`
  - `warning`
  - `critical`

- `notification_status`
  - `unread`
  - `read`
  - `archived`

- `document_status`
  - `draft`
  - `active`
  - `expired`
  - `archived`

### Tables

#### `vendor_organizations`

Represents a business, brand, or operating company.

Fields:

- `id uuid primary key`
- `owner_user_id uuid references profiles(id)`
- `primary_vendor_profile_id uuid references vendor_profiles(id)`
- `name text not null`
- `legal_name text`
- `slug text unique not null`
- `description text`
- `logo_url text`
- `cover_url text`
- `default_currency text default 'INR'`
- `timezone text default 'Asia/Kolkata'`
- `categories vendor_business_category[] default '{}'`
- `settings jsonb default '{}'`
- `is_active boolean default true`
- `created_at timestamptz default now()`
- `updated_at timestamptz`

#### `vendor_branches`

Represents a branch, property, office, destination desk, activity base, or fleet depot.

Fields:

- `id uuid primary key`
- `organization_id uuid references vendor_organizations(id)`
- `name text not null`
- `branch_code text`
- `categories vendor_business_category[] default '{}'`
- `address text`
- `city text`
- `state text`
- `country text default 'India'`
- `pincode text`
- `lat double precision`
- `lng double precision`
- `phone text`
- `email text`
- `manager_user_id uuid references profiles(id)`
- `settings jsonb default '{}'`
- `is_active boolean default true`
- `created_at timestamptz default now()`
- `updated_at timestamptz`

#### `vendor_team_members`

Connects users to organizations and optionally to branches.

Fields:

- `id uuid primary key`
- `organization_id uuid references vendor_organizations(id)`
- `branch_id uuid references vendor_branches(id)`
- `user_id uuid references profiles(id)`
- `role vendor_os_role not null`
- `title text`
- `invited_email text`
- `invited_by uuid references profiles(id)`
- `accepted_at timestamptz`
- `is_active boolean default true`
- `created_at timestamptz default now()`
- Unique membership constraint on `organization_id, branch_id, user_id`.

#### `vendor_role_permissions`

Stores module permissions per role. This allows permissions to be changed without redeploying frontend code.

Fields:

- `id uuid primary key`
- `role vendor_os_role not null`
- `module vendor_os_module not null`
- `actions permission_action[] not null`
- Unique constraint on `role, module`.

#### `vendor_audit_logs`

Append-only event trail for sensitive actions.

Fields:

- `id uuid primary key`
- `organization_id uuid references vendor_organizations(id)`
- `branch_id uuid references vendor_branches(id)`
- `actor_user_id uuid references profiles(id)`
- `module vendor_os_module not null`
- `action text not null`
- `entity_type text`
- `entity_id uuid`
- `severity audit_event_severity default 'info'`
- `metadata jsonb default '{}'`
- `created_at timestamptz default now()`

RLS allows members with audit/settings permissions to read logs. Insert is allowed for organization members and service-level backend jobs.

#### `vendor_notifications`

Notification center feed for operational events.

Fields:

- `id uuid primary key`
- `organization_id uuid references vendor_organizations(id)`
- `branch_id uuid references vendor_branches(id)`
- `recipient_user_id uuid references profiles(id)`
- `module vendor_os_module not null`
- `title text not null`
- `body text`
- `status notification_status default 'unread'`
- `priority audit_event_severity default 'info'`
- `action_url text`
- `metadata jsonb default '{}'`
- `created_at timestamptz default now()`
- `read_at timestamptz`

#### `vendor_documents`

Reusable document records for KYC, permits, insurance, vehicle papers, guest documents, contracts, and vouchers.

Fields:

- `id uuid primary key`
- `organization_id uuid references vendor_organizations(id)`
- `branch_id uuid references vendor_branches(id)`
- `uploaded_by uuid references profiles(id)`
- `module vendor_os_module not null`
- `entity_type text`
- `entity_id uuid`
- `name text not null`
- `document_type text not null`
- `storage_path text not null`
- `mime_type text`
- `file_size_bytes bigint`
- `status document_status default 'active'`
- `expires_at timestamptz`
- `metadata jsonb default '{}'`
- `created_at timestamptz default now()`

#### `vendor_os_module_settings`

Stores enabled module state per organization and branch.

Fields:

- `id uuid primary key`
- `organization_id uuid references vendor_organizations(id)`
- `branch_id uuid references vendor_branches(id)`
- `module vendor_os_module not null`
- `is_enabled boolean default true`
- `settings jsonb default '{}'`
- `created_at timestamptz default now()`
- `updated_at timestamptz`
- Unique constraint on `organization_id, branch_id, module`.

## Row Level Security

RLS will be based on organization membership.

Core checks:

- A user can read an organization if they are the owner or an active team member.
- A user can read a branch if they can read the parent organization.
- A user can manage a branch if their role has `branches.manage` or `branches.update`.
- A user can read documents if their role has `documents.view`.
- A user can upload documents if their role has `documents.create`.
- A user can read notifications addressed to them.
- A user can update only their own notification status.
- A user can read audit logs if their role has `settings.view`, `analytics.view`, or future `audit.view` permission.
- Vendor listings remain marketplace-readable when `is_active = true`, but management actions must be limited to organization members with marketplace permissions.

## Permissions

Default role behavior:

- `owner`: all modules, all actions.
- `admin`: all modules except subscription billing ownership transfer.
- `manager`: view/create/update across operations, marketplace, calendar, inbox, CRM, PMS, tours, activities, fleet.
- `operations`: calendar, inbox, PMS, tours, activities, fleet, documents.
- `sales`: CRM, inbox, marketplace, analytics view.
- `accountant`: accounting, analytics, documents, bookings view.
- `staff`: assigned branch operational view/update only.
- `viewer`: read-only access to assigned modules.

The frontend will use a `can(module, action)` helper. Backend services must still rely on Supabase RLS and not trust frontend checks.

## Folder Structure

Phase one will add:

```text
src/features/vendor-os/
  api.ts
  audit.ts
  data.ts
  hooks.ts
  permissions.ts
  realtime.ts
  routes.ts
  types.ts
  components/
    VendorOSLayout.tsx
    VendorOSSidebar.tsx
    VendorOSTopbar.tsx
    BranchSwitcher.tsx
    ModuleCard.tsx
    PermissionGate.tsx
    NotificationCenter.tsx
    AuditTimeline.tsx
    DocumentVault.tsx
  pages/
    Dashboard.tsx
    CRM.tsx
    Calendar.tsx
    Inbox.tsx
    Accounting.tsx
    Team.tsx
    PMS.tsx
    Tours.tsx
    Activities.tsx
    Fleet.tsx
    AIAssistant.tsx
    Marketplace.tsx
    Subscriptions.tsx
    Analytics.tsx
    Branches.tsx
    Documents.tsx
    Settings.tsx
```

Tests:

```text
src/features/vendor-os/
  permissions.test.ts
  hooks.test.tsx
  pages/
    Dashboard.test.tsx
```

Schema:

```text
supabase_schema.sql
```

Routing:

```text
src/App.tsx
```

## API And Service Boundaries

The browser app will not call Supabase directly from UI pages. UI pages call hooks; hooks call feature services; services call Supabase.

Service functions:

- `listVendorOrganizations(userId)`
- `getVendorOrganization(organizationId)`
- `createVendorOrganization(input)`
- `listVendorBranches(organizationId)`
- `createVendorBranch(input)`
- `updateVendorBranch(branchId, input)`
- `listVendorTeamMembers(organizationId)`
- `upsertVendorTeamMember(input)`
- `listRolePermissions()`
- `canAccessVendorModule(context, module, action)`
- `listVendorNotifications(context)`
- `markVendorNotificationRead(notificationId)`
- `createVendorAuditLog(input)`
- `listVendorAuditLogs(context)`
- `listVendorDocuments(context)`
- `createVendorDocumentRecord(input)`

Realtime subscriptions:

- Notifications for current user.
- Audit events for active organization if user has permission.
- Future module channels will reuse this context.

## UI Design Direction

The Vendor OS should feel like enterprise-grade travel operations software, not a marketplace page.

Design principles:

- White and light-gray operational canvas.
- Emerald green as the Tripetrip action/accent color.
- Dense, scannable dashboards for repeated daily use.
- Sidebar-first layout on desktop.
- Bottom/module navigation on mobile.
- Branch and organization context visible in the top bar.
- Permission-aware modules hidden or disabled with clear states.
- No decorative landing-page hero treatment inside the operating system.
- Cards only for individual operational objects, not nested page sections.

## First Screen Behavior

`/vendor/os` loads the Vendor OS dashboard.

If the signed-in user has no organization:

- Show an onboarding state to create the first business.
- Pre-fill name and business type from `vendor_profiles` if available.
- Create default organization, default branch, owner team membership, default module settings, and an audit log.

If the user has one organization:

- Select it automatically.
- Select the first active branch or "All branches."

If the user has multiple organizations:

- Show an organization switcher.
- Persist the selected organization in local storage.

## Error Handling

- Supabase errors are converted into typed app errors with user-safe messages.
- Permission failures show `Access denied` module states instead of broken screens.
- Missing organization state routes the user to onboarding.
- Realtime failures fall back to polling on the next hook refresh.
- Document upload metadata can be created only after storage upload succeeds.
- Audit log writes should not block the primary UI action unless the action is compliance-critical.

## Testing Strategy

Phase one tests:

- Permission matrix unit tests.
- Tenant context hook tests for no organization, one organization, multiple organizations.
- Dashboard rendering tests for role-aware module cards.
- Notification center tests for read/unread behavior.
- Schema smoke review by running the app test suite and lint.

Commands:

- `npm test -- src/features/vendor-os/permissions.test.ts src/features/vendor-os/hooks.test.tsx src/features/vendor-os/pages/Dashboard.test.tsx`
- `npm run lint`
- `npm run build`

## Implementation Roadmap

## Development Status

### Completed And Committed

- Phase 1: Vendor OS Foundation
  - Multi-tenant shell, organization and branch context, permission matrix, audit logs, notifications, document vault, service boundaries, route shell, and dashboard foundation.
- Phase 2: CRM And Inbox
  - Dedicated CRM and Inbox command center with lead pipeline, traveler conversation queue, follow-up signals, assignments, and deep workspace tests.
- Phase 3: Calendar And Live Inventory
  - Dedicated calendar and capacity workspace across PMS rooms, tours, activity slots, fleet availability, blackouts, and marketplace sync lanes.
- Phase 4: PMS
  - Dedicated front desk workspace with room grid, housekeeping board, arrivals/departures, folio snapshot, guest verification, and property operations controls.
- Phase 5: Tours And Activities
  - Dedicated tour operator and activity management workspace with departures, guide rosters, manifests, slots, equipment readiness, waivers, and safety desk.
- Phase 6: Fleet
  - Dedicated fleet dispatch workspace with vehicles, drivers, assignments, maintenance, fuel, permits, compliance alerts, marketplace oversell guard, and trip manifests.
- Phase 7: Accounting
  - Dedicated finance workspace with receivables, invoices, expenses, payouts, commissions, tax controls, ledger health, role-based finance controls, and exports.

### Remaining Dedicated Module Builds

- Phase 8: Marketplace Operations
- Phase 9: AI Operations Assistant
- Phase 10: Subscriptions And Analytics
- Advanced team management workflows
- Advanced multi-branch controls
- Full API routes and realtime channels for every module
- Production AI provider integrations
- Deeper document automation and approval workflows

### Phase 1: Vendor OS Foundation

1. Extend Supabase schema with organizations, branches, team members, role permissions, audit logs, notifications, documents, and module settings.
2. Add Vendor OS TypeScript types.
3. Add permission matrix and tests.
4. Add Vendor OS Supabase services.
5. Add tenant context hooks.
6. Add Vendor OS layout and navigation shell.
7. Add dashboard, branches, team, documents, notifications, and audit foundation views.
8. Wire `/vendor/os` routes.
9. Add focused tests.
10. Run lint, tests, and build.
11. Commit and push.

### Phase 2: CRM And Inbox

Build customers, leads, conversation threads, notes, tasks, follow-ups, booking-linked customer records, and notification triggers.

### Phase 3: Calendar And Live Inventory

Build a unified availability calendar for listings, rooms, departures, activity slots, vehicles, blackout dates, and capacity changes.

### Phase 4: PMS

Build property hierarchy, room types, rooms, rates, check-ins, housekeeping, folios, guest documents, and daily arrival/departure workflows.

### Phase 5: Tours And Activities

Build itineraries, departures, guide assignment, safety checklists, equipment, manifests, pickup points, and group booking tools.

### Phase 6: Fleet

Build vehicles, drivers, permits, duty assignments, fuel logs, maintenance schedules, and trip manifests.

### Phase 7: Accounting

Build invoices, expenses, payouts, commissions, taxes, ledger, vendor receivables, and financial reports.

### Phase 8: Marketplace Operations

Connect internal inventory and rates to public Tripetrip listings, deals, direct booking discounts, and channel performance.

### Phase 9: AI Operations Assistant

Add AI-generated operations insights, reply drafts, pricing suggestions, risk alerts, and daily task summaries.

### Phase 10: Subscriptions And Analytics

Add vendor plans, usage tracking, subscription states, analytics dashboards, exports, and conversion reporting.

## Success Criteria

Phase one is successful when:

- A vendor can open `/vendor/os`.
- The app can create or load a vendor organization.
- The vendor can switch organization and branch context.
- The shell shows module navigation for all planned systems.
- Permissions control which modules and actions are visible.
- Team, branch, notification, audit, and document foundations exist in schema and services.
- Existing marketplace routes continue to work.
- Tests, lint, and production build pass.
