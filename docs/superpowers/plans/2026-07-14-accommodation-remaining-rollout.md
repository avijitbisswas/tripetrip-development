# Accommodation Remaining Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining accommodation launch work across guest operations, booking depth, billing depth, entitlement controls, enterprise views, advanced integrations, and production hardening without breaking the existing Vendor OS accommodation foundation.

**Architecture:** Continue shipping vertical slices on top of the current PMS, accounting, marketplace, analytics, admin-control, and Worker-backed mutation foundations. Each slice must produce a real operational workflow, preserve accommodation access enforcement, and leave the later payment-wall and enterprise layers wired through the same control plane rather than parallel code paths.

**Tech Stack:** React, TypeScript, Vitest, Supabase, Cloudflare Worker routes, existing Vendor OS hooks, accommodation access policies, current admin console controls.

---

### Task 1: Guest operations depth

**Files:**
- Modify: `src/features/vendor-os/components/PmsWorkspace.tsx`
- Modify: `src/features/vendor-os/components/PmsWorkspace.test.tsx`
- Modify: `src/features/vendor-os/types.ts`
- Modify: `src/features/vendor-os/api.ts`

- [x] Add guest pre-check-in state, OTP-free readiness inputs, and profile enrichment fields that attach to reservations through the current PMS layer.
- [x] Add a live pre-check-in desk for contact readiness, ETA capture, identity status, and manual arrival notes.
- [x] Add tests for readiness submission, state display, and reservation-linked pre-check-in workflows.
- [x] Commit the guest-operations slice after focused tests and build verification.

### Task 2: Booking engine depth

**Files:**
- Modify: `src/features/vendor-os/components/PmsWorkspace.tsx`
- Modify: `src/features/vendor-os/components/PmsWorkspace.test.tsx`
- Modify: `src/features/vendor-os/api.ts`
- Modify: `src/features/vendor-os/types.ts`

- [x] Add group-booking support, reservation modification controls, and stronger hold/conflict logic on top of current room assignment behavior.
- [x] Add rate-plan-aware reservation controls using the existing room-type and marketplace pricing foundations instead of a separate booking stack.
- [x] Add tests covering group reservations, date changes, cancellation/modification, and hold collisions.
- [x] Commit the booking-depth slice after verification.

### Task 3: Billing and finance depth

**Files:**
- Modify: `src/features/vendor-os/components/AccountingWorkspace.tsx`
- Modify: `src/features/vendor-os/components/AccountingWorkspace.test.tsx`
- Modify: `src/features/vendor-os/api.ts`
- Modify: `src/features/vendor-os/types.ts`

- [x] Add GST invoice detail capture, refund workflows, and night-audit-friendly end-of-day finance summaries using current payment and folio records.
- [x] Add finance review actions for refunds, reconciliation states, and daily close summaries without introducing fake buttons.
- [x] Add tests for refund state sync, invoice generation inputs, and night-audit totals.
- [x] Commit the finance-depth slice after verification.

### Task 4: Admin entitlement and payment-wall controls

**Files:**
- Modify: `src/pages/admin/Console.tsx`
- Modify: `src/features/vendor-os/accommodationAccess.ts`
- Modify: `src/features/vendor-os/accommodationModuleInsights.ts`
- Modify: `src/features/vendor-os/hooks.ts`
- Test: `src/features/admin/controlPlane.test.ts`

- [x] Add feature-level entitlement toggles for the new accommodation slices so they can remain open now and be gated later without rewiring workflows.
- [x] Surface entitlement state clearly in vendor-facing workspaces through the existing accommodation insight pattern.
- [x] Add tests proving the access wall can later disable premium features without breaking core modules.
- [x] Commit the entitlement-control slice after verification.

### Task 5: Enterprise multi-property operations

**Files:**
- Modify: `src/features/vendor-os/components/AnalyticsWorkspace.tsx`
- Modify: `src/features/vendor-os/components/AnalyticsWorkspace.test.tsx`
- Modify: `src/features/vendor-os/components/PmsWorkspace.tsx`

- [x] Add multi-property rollups, branch/property filters, and enterprise operations summaries using existing reservation, housekeeping, folio, and payment data.
- [x] Keep the UI inside the current Vendor OS information architecture rather than creating a disconnected enterprise console.
- [x] Add tests for cross-property rollups and filtered operational views.
- [x] Commit the enterprise slice after verification.

### Task 6: Advanced integration foundations

**Files:**
- Modify: `src/features/vendor-os/components/MarketplaceWorkspace.tsx`
- Modify: `src/features/vendor-os/components/MarketplaceWorkspace.test.tsx`
- Modify: `src/features/vendor-os/components/AIAssistantWorkspace.tsx`
- Modify: `src/features/vendor-os/components/AIAssistantWorkspace.test.tsx`

- [x] Add stronger OTA-ready mapping and retry surfaces where they can be real today, while keeping true third-party adapter work documented as deferred until credentials and providers exist.
- [x] Add real pricing-signal and operations-risk surfaces backed by current occupancy, collection, and housekeeping data instead of fake AI actions.
- [x] Add tests for the new mapping, signal, and recommendation flows.
- [x] Commit the advanced-foundations slice after verification.

### Task 7: Production hardening and rollout verification

**Files:**
- Modify: `docs/status/accommodation-rollout-status.md`
- Modify: `.github/workflows/cloudflare-pages-deploy.yml` if rollout automation changes are required
- Modify: `wrangler.jsonc` only if environment/config alignment is needed

- [x] Keep the rollout status file current after each delivered slice.
- [x] Run targeted tests for each slice, then broader accommodation verification and production build checks.
- [ ] Verify required migrations, secrets, and deployment dependencies are documented before claiming the rollout is production-ready.
- [ ] Commit each production-hardening checkpoint separately when it changes code or docs.
