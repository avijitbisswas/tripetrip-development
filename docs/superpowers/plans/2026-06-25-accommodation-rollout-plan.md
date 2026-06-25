# Accommodation Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real accommodation-provider access layer with plan tiers, admin-managed overrides, Vendor OS module filtering, and delivery-status tracking while keeping all features open by default.

**Architecture:** Introduce a dedicated accommodation access model in Vendor OS, persist admin overrides through the existing worker-backed control plane, and resolve effective access inside the Vendor OS tenant hook so navigation and module visibility are driven by policy instead of hard-coded assumptions. Avoid schema churn in phase one by reusing the existing admin control-plane persistence pattern and exposing a vendor-facing access endpoint.

**Tech Stack:** React, TypeScript, Vitest, existing Cloudflare Worker API layer, existing admin control plane, Supabase client services

---

### Task 1: Add the accommodation access domain model

**Files:**
- Create: `src/features/vendor-os/accommodationAccess.ts`
- Test: `src/features/vendor-os/accommodationAccess.test.ts`

- [ ] Define provider family, plan tier, capability, approval, and access-policy types.
- [ ] Add normalization from `business_type` to accommodation provider family.
- [ ] Add accommodation module bundles and default open-by-default policy.
- [ ] Add policy resolution helpers for effective module access.
- [ ] Cover normalization and access resolution with unit tests.

### Task 2: Expose access policy through the worker control plane

**Files:**
- Modify: `src/features/admin/controlPlane.ts`
- Modify: `worker/index.ts`
- Test: `worker/index.test.ts`

- [ ] Add control-plane helpers to read and write vendor accommodation access payloads.
- [ ] Add authenticated vendor-facing endpoint for current access policy.
- [ ] Add admin endpoints to list and update accommodation access state.
- [ ] Ensure unauthenticated and non-admin access is rejected correctly.
- [ ] Test worker responses for default and overridden access behavior.

### Task 3: Add frontend services for accommodation access

**Files:**
- Modify: `src/services/admin.ts`
- Create: `src/features/vendor-os/accessService.ts`

- [ ] Add admin service methods for listing and updating accommodation access.
- [ ] Add vendor-facing access fetch service for Vendor OS.
- [ ] Keep service interfaces small and aligned with existing fetch wrappers.

### Task 4: Resolve access inside Vendor OS tenant state

**Files:**
- Modify: `src/features/vendor-os/types.ts`
- Modify: `src/features/vendor-os/hooks.ts`
- Possibly modify: `src/services/vendors.ts`
- Test: `src/features/vendor-os/hooks.test.tsx`

- [ ] Extend tenant context with vendor profile and effective accommodation access.
- [ ] Replace raw role-only module checks with role + accommodation access resolution.
- [ ] Keep behavior permissive when no policy exists.
- [ ] Test that accommodation vendors get filtered modules and non-filtered behavior stays stable otherwise.

### Task 5: Filter Vendor OS navigation and module cards

**Files:**
- Modify: `src/features/vendor-os/pages/Dashboard.tsx`
- Possibly modify: `src/features/vendor-os/components/VendorOSSidebar.tsx`
- Possibly modify: `src/features/vendor-os/components/VendorOSLayout.tsx`
- Test: `src/features/vendor-os/pages/Dashboard.test.tsx`

- [ ] Use effective access to filter visible modules.
- [ ] Surface plan/family/access summary in the Vendor OS dashboard.
- [ ] Keep advanced capabilities framed as roadmap status, not false-live operations.

### Task 6: Add admin accommodation controls

**Files:**
- Modify: `src/pages/admin/Console.tsx`
- Modify: `src/services/admin.ts`

- [ ] Add an accommodation section to the admin console.
- [ ] Show vendor business type, normalized family, plan tier, and module toggles.
- [ ] Allow saving per-vendor overrides through the admin API.
- [ ] Keep the UX compact and manually testable.

### Task 7: Update delivery tracking docs during implementation

**Files:**
- Modify: `docs/status/accommodation-rollout-status.md`

- [ ] Mark completed implementation slices.
- [ ] Call out what remains deferred after phase one.
- [ ] Keep the document honest about scope boundaries.

### Task 8: Verify and deploy

**Files:**
- Modify as needed from earlier tasks

- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Run `npm run build`
- [ ] Run `npx wrangler deploy --dry-run`
- [ ] Run `npx wrangler deploy`
- [ ] Commit and push the phase-one implementation
