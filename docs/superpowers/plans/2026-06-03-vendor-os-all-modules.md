# Vendor OS All Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Develop operating foundations for every remaining Vendor OS phase so Tripetrip has a connected travel business OS, not only a navigation shell.

**Architecture:** Extend the Vendor OS schema with operational tables for CRM, calendar, inbox, accounting, PMS, tours, activities, fleet, AI, marketplace sync, subscriptions, and analytics. Add a complete module workspace registry and render each module with concrete records, KPIs, workflow actions, and next operational steps.

**Tech Stack:** React, TypeScript, Vite, Vitest, Supabase SQL, React Router, shadcn UI, lucide-react.

---

## File Structure

- Modify `supabase_schema.sql`: Add operational tables and indexes for all Vendor OS modules.
- Create `src/features/vendor-os/moduleWorkflows.ts`: Complete workflow metadata for every module.
- Create `src/features/vendor-os/moduleWorkflows.test.ts`: Coverage tests for every required module.
- Modify `src/features/vendor-os/pages/Dashboard.tsx`: Render richer module workspaces from workflow metadata.
- Modify `src/features/vendor-os/pages/Dashboard.test.tsx`: Verify staff-safe module rendering still works and workflow content appears.
- Add plan file `docs/superpowers/plans/2026-06-03-vendor-os-all-modules.md`.

---

### Task 1: Module Workflow Coverage

- [ ] Write failing tests in `moduleWorkflows.test.ts` that require every Vendor OS module to have KPIs, workflow lanes, records, and actions.
- [ ] Run `npm test -- src/features/vendor-os/moduleWorkflows.test.ts` and confirm it fails because the module does not exist.
- [ ] Implement `moduleWorkflows.ts` with complete workflow definitions.
- [ ] Rerun the module workflow tests and confirm they pass.

### Task 2: Operational Database Schema

- [ ] Extend `supabase_schema.sql` with tables for customers, leads, tasks, calendar events, inventory blocks, conversations, invoices, expenses, ledger entries, properties, room types, rooms, housekeeping tasks, tour itineraries, tour departures, activity slots, equipment, safety logs, vehicles, drivers, maintenance, marketplace sync, AI insights, subscriptions, and analytics snapshots.
- [ ] Add indexes for organization, branch, module, status, and date queries.
- [ ] Enable RLS on every new operational table.
- [ ] Add organization-member read policies and owner/admin/manager write policies.
- [ ] Run `Select-String` checks for representative tables.

### Task 3: UI Integration

- [ ] Modify `Dashboard.tsx` so non-dashboard module routes render KPIs, workflow lanes, records, and primary actions from `moduleWorkflows.ts`.
- [ ] Keep restricted modules hidden through the existing permission helper.
- [ ] Rerun dashboard tests and update assertions for new workflow content.

### Task 4: Verification And Commit

- [ ] Run `npm test -- src/features/vendor-os/permissions.test.ts src/features/vendor-os/hooks.test.tsx src/features/vendor-os/moduleWorkflows.test.ts src/features/vendor-os/pages/Dashboard.test.tsx`.
- [ ] Run `npm test -- src/components/Layout.test.tsx src/pages/tripetrip-marketplace.test.tsx`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit with `git commit -m "feat: add vendor os module foundations"`.

