# Accommodation Operations Slice 1 PMS Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Vendor OS PMS module into a real accommodation operations workspace with live room types, rooms, reservations, housekeeping tasks, folio entries, and derived operational metrics.

**Architecture:** Reuse the existing Vendor OS tenant model, Worker-backed mutation route, and accommodation access wall. Extend the current PMS schema with missing reservation and folio entities, add operation-aware read and write helpers, and upgrade the PMS workspace to operate against real records instead of static arrays.

**Tech Stack:** React, TypeScript, Vitest, Supabase, Cloudflare Worker mutation routes, existing Vendor OS hooks and module definitions.

---

### Task 1: Extend PMS persistence and operation metadata

**Files:**
- Modify: `supabase_schema.sql`
- Modify: `src/features/vendor-os/operations.ts`
- Test: `src/features/vendor-os/schema.test.ts`
- Test: `src/features/vendor-os/operations.test.ts`

- [ ] Add `vendor_pms_reservations` and `vendor_folio_entries` to `supabase_schema.sql`.
- [ ] Add index and RLS coverage for the new PMS tables.
- [ ] Add operation definitions for `pms_reservations` and `pms_folios` via the existing PMS module metadata strategy or equivalent helper wiring used by the workspace.
- [ ] Update schema and operation tests to assert the new tables and metadata exist.

### Task 2: Add PMS read and write helpers

**Files:**
- Modify: `src/features/vendor-os/api.ts`
- Modify: `src/features/vendor-os/types.ts`
- Test: `src/features/vendor-os/api.test.ts`

- [ ] Add typed list helpers for room types, rooms, reservations, housekeeping tasks, and folio entries scoped by organization.
- [ ] Add create and update helpers for reservations, housekeeping tasks, and folio entries through the current mutation route.
- [ ] Add minimal PMS-specific row types for workspace consumption.
- [ ] Test tenant-scoped reads and mutation payloads for the new PMS entities.

### Task 3: Upgrade PMS workspace behavior

**Files:**
- Modify: `src/features/vendor-os/components/PmsWorkspace.tsx`
- Test: `src/features/vendor-os/components/PmsWorkspace.test.tsx`

- [ ] Replace static room, arrival, housekeeping, and folio boards with data derived from live records.
- [ ] Add forms for room type creation, room creation, reservation creation, housekeeping task creation, and folio entry creation.
- [ ] Add reservation status and housekeeping status update controls.
- [ ] Compute occupancy, arrivals, dirty rooms, and open folio metrics from live data.
- [ ] Keep accommodation guidance panels intact while making the operational controls functional.

### Task 4: Keep worker and access enforcement aligned

**Files:**
- Modify: `worker/index.ts`
- Test: `worker/index.test.ts`

- [ ] Ensure the Worker mutation route accepts the new PMS tables through the existing module path.
- [ ] Verify PMS writes remain blocked when accommodation access disables the PMS module.
- [ ] Add tests for reservation and folio mutations if extra Worker-side normalization or validation is introduced.

### Task 5: Update rollout documentation and verify

**Files:**
- Modify: `docs/status/accommodation-rollout-status.md`

- [ ] Mark the delivered PMS Core items as done and note the next slice as payment operations.
- [ ] Run targeted PMS tests.
- [ ] Run build verification.
- [ ] Deploy only after local verification is green.
