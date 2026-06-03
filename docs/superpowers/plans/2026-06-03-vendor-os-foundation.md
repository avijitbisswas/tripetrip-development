# Vendor OS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-ready foundation slice for the Tripetrip Vendor Operating System.

**Architecture:** Extend Supabase with tenant, branch, team, permission, audit, notification, document, and module-setting tables. Add a typed Vendor OS feature package with permission helpers, Supabase services, React hooks, and a `/vendor/os` shell that exposes role-aware module navigation and foundational pages.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, Supabase, React Router, TanStack Query, shadcn UI, lucide-react.

---

## File Structure

- Modify `supabase_schema.sql`: Add Vendor OS enums, tables, indexes, RLS policies, and default role permission seed data.
- Create `src/features/vendor-os/types.ts`: Shared TypeScript types for organizations, branches, team members, permissions, notifications, audit logs, documents, and module metadata.
- Create `src/features/vendor-os/permissions.ts`: Role permission matrix and `canAccessVendorModule` helper.
- Create `src/features/vendor-os/permissions.test.ts`: Unit tests for role/module/action permissions.
- Create `src/features/vendor-os/api.ts`: Supabase service functions for organizations, branches, teams, notifications, audit logs, and documents.
- Create `src/features/vendor-os/hooks.ts`: React hooks for active tenant context, notifications, and audit/documents lists.
- Create `src/features/vendor-os/hooks.test.tsx`: Hook tests with mocked service dependencies.
- Create `src/features/vendor-os/data.ts`: Static module navigation metadata.
- Create `src/features/vendor-os/components/PermissionGate.tsx`: Conditionally renders children by permission.
- Create `src/features/vendor-os/components/VendorOSLayout.tsx`: Desktop/mobile operating system shell.
- Create `src/features/vendor-os/components/VendorOSSidebar.tsx`: Role-aware sidebar.
- Create `src/features/vendor-os/components/VendorOSTopbar.tsx`: Organization and branch controls plus notifications.
- Create `src/features/vendor-os/components/BranchSwitcher.tsx`: Branch selector.
- Create `src/features/vendor-os/components/ModuleCard.tsx`: Dashboard module card.
- Create `src/features/vendor-os/components/NotificationCenter.tsx`: Notification popover/list.
- Create `src/features/vendor-os/components/AuditTimeline.tsx`: Audit event list.
- Create `src/features/vendor-os/components/DocumentVault.tsx`: Document list foundation.
- Create `src/features/vendor-os/pages/Dashboard.tsx`: Vendor OS landing dashboard.
- Create module placeholder pages in `src/features/vendor-os/pages/*.tsx`: CRM, Calendar, Inbox, Accounting, Team, PMS, Tours, Activities, Fleet, AIAssistant, Marketplace, Subscriptions, Analytics, Branches, Documents, Settings.
- Create `src/features/vendor-os/pages/Dashboard.test.tsx`: Dashboard rendering and permission tests.
- Modify `src/App.tsx`: Add `/vendor/os` and nested module routes.

---

### Task 1: Permission Core

**Files:**
- Create: `src/features/vendor-os/types.ts`
- Create: `src/features/vendor-os/permissions.ts`
- Test: `src/features/vendor-os/permissions.test.ts`

- [ ] **Step 1: Write failing permission tests**

```ts
import { describe, expect, it } from 'vitest';
import { canAccessVendorModule, getAllowedVendorModules } from './permissions';

describe('Vendor OS permissions', () => {
  it('gives owners every module action', () => {
    expect(canAccessVendorModule('owner', 'accounting', 'delete')).toBe(true);
    expect(canAccessVendorModule('owner', 'subscriptions', 'manage')).toBe(true);
    expect(canAccessVendorModule('owner', 'settings', 'export')).toBe(true);
  });

  it('keeps staff out of accounting and subscription management', () => {
    expect(canAccessVendorModule('staff', 'calendar', 'view')).toBe(true);
    expect(canAccessVendorModule('staff', 'pms', 'update')).toBe(true);
    expect(canAccessVendorModule('staff', 'accounting', 'view')).toBe(false);
    expect(canAccessVendorModule('staff', 'subscriptions', 'manage')).toBe(false);
  });

  it('lets accountants manage accounting and view documents', () => {
    expect(canAccessVendorModule('accountant', 'accounting', 'manage')).toBe(true);
    expect(canAccessVendorModule('accountant', 'documents', 'view')).toBe(true);
    expect(canAccessVendorModule('accountant', 'fleet', 'update')).toBe(false);
  });

  it('returns only viewable modules for a role', () => {
    expect(getAllowedVendorModules('sales')).toContain('crm');
    expect(getAllowedVendorModules('sales')).toContain('marketplace');
    expect(getAllowedVendorModules('sales')).not.toContain('fleet');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/vendor-os/permissions.test.ts`

Expected: fails because `src/features/vendor-os/permissions.ts` does not exist.

- [ ] **Step 3: Implement types and permission helper**

Create `types.ts` with vendor role/module/action unions and interfaces. Create `permissions.ts` with a default permission matrix for owner, admin, manager, operations, sales, accountant, staff, and viewer.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/features/vendor-os/permissions.test.ts`

Expected: all permission tests pass.

---

### Task 2: Supabase Schema Foundation

**Files:**
- Modify: `supabase_schema.sql`

- [ ] **Step 1: Extend schema**

Add enums, tables, indexes, RLS enablement, policies, and seed permissions for `vendor_organizations`, `vendor_branches`, `vendor_team_members`, `vendor_role_permissions`, `vendor_audit_logs`, `vendor_notifications`, `vendor_documents`, and `vendor_os_module_settings`.

- [ ] **Step 2: Review schema text for idempotency**

Run: `Select-String -Path supabase_schema.sql -Pattern 'vendor_organizations|vendor_role_permissions|vendor_notifications'`

Expected: the new objects are present and guarded with `IF NOT EXISTS` or `DROP POLICY IF EXISTS`.

---

### Task 3: Vendor OS API Services

**Files:**
- Create: `src/features/vendor-os/api.ts`

- [ ] **Step 1: Write service interfaces**

Create typed functions for listing and creating organizations, branches, team members, permissions, notifications, audit logs, and documents. Use existing `supabase` import conventions from `src/services/*.ts`.

- [ ] **Step 2: Add safe defaults**

Ensure list functions return empty arrays when optional IDs are missing. Ensure create functions insert typed payloads and return typed records.

---

### Task 4: Tenant And Notification Hooks

**Files:**
- Create: `src/features/vendor-os/hooks.test.tsx`
- Create: `src/features/vendor-os/hooks.ts`

- [ ] **Step 1: Write failing hook tests**

Test that `useVendorOSTenant` exposes loading state, selected organization, active branch, and `can()` helper after mocked API data resolves. Test that `useVendorOSNotifications` returns unread count.

- [ ] **Step 2: Run the hook tests to verify they fail**

Run: `npm test -- src/features/vendor-os/hooks.test.tsx`

Expected: fails because hooks do not exist.

- [ ] **Step 3: Implement hooks**

Implement hooks using React state/effect and service functions from `api.ts`.

- [ ] **Step 4: Run the hook tests to verify they pass**

Run: `npm test -- src/features/vendor-os/hooks.test.tsx`

Expected: hook tests pass.

---

### Task 5: Vendor OS UI Shell And Pages

**Files:**
- Create: `src/features/vendor-os/data.ts`
- Create: `src/features/vendor-os/components/PermissionGate.tsx`
- Create: `src/features/vendor-os/components/VendorOSLayout.tsx`
- Create: `src/features/vendor-os/components/VendorOSSidebar.tsx`
- Create: `src/features/vendor-os/components/VendorOSTopbar.tsx`
- Create: `src/features/vendor-os/components/BranchSwitcher.tsx`
- Create: `src/features/vendor-os/components/ModuleCard.tsx`
- Create: `src/features/vendor-os/components/NotificationCenter.tsx`
- Create: `src/features/vendor-os/components/AuditTimeline.tsx`
- Create: `src/features/vendor-os/components/DocumentVault.tsx`
- Create: `src/features/vendor-os/pages/Dashboard.tsx`
- Create: module pages under `src/features/vendor-os/pages/`
- Test: `src/features/vendor-os/pages/Dashboard.test.tsx`

- [ ] **Step 1: Write failing dashboard test**

Test that the dashboard renders "Tripetrip Vendor OS", module cards, unread notifications, and hides restricted module cards for staff role.

- [ ] **Step 2: Run dashboard test to verify it fails**

Run: `npm test -- src/features/vendor-os/pages/Dashboard.test.tsx`

Expected: fails because the dashboard page does not exist.

- [ ] **Step 3: Implement shell and pages**

Build responsive Vendor OS UI with sidebar desktop navigation, mobile horizontal module navigation, topbar branch switcher, notification center, module cards, audit timeline, and document vault.

- [ ] **Step 4: Run dashboard test to verify it passes**

Run: `npm test -- src/features/vendor-os/pages/Dashboard.test.tsx`

Expected: dashboard tests pass.

---

### Task 6: Routing

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add Vendor OS route imports**

Lazy-load `VendorOSDashboard` and module pages.

- [ ] **Step 2: Add authenticated routes**

Add:

```tsx
<Route path="/vendor/os" element={session ? <VendorOSDashboard /> : <Navigate to="/login" />} />
<Route path="/vendor/os/:module" element={session ? <VendorOSDashboard /> : <Navigate to="/login" />} />
```

The dashboard will route module content internally based on URL param for the first phase.

---

### Task 7: Verification And Commit

**Files:**
- All changed files

- [ ] **Step 1: Run focused tests**

Run: `npm test -- src/features/vendor-os/permissions.test.ts src/features/vendor-os/hooks.test.tsx src/features/vendor-os/pages/Dashboard.test.tsx`

Expected: all tests pass.

- [ ] **Step 2: Run layout regression tests**

Run: `npm test -- src/components/Layout.test.tsx src/pages/tripetrip-marketplace.test.tsx`

Expected: existing layout and marketplace tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: exit code 0. Large chunk warnings are acceptable if Vite exits successfully.

- [ ] **Step 5: Commit**

Run:

```bash
git add supabase_schema.sql src/features/vendor-os src/App.tsx docs/superpowers/plans/2026-06-03-vendor-os-foundation.md
git commit -m "feat: add vendor os foundation"
```

