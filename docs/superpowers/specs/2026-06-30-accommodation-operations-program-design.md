# Accommodation Operations Program Design

## Goal

Build a real accommodation operations platform inside Vendor OS for hotels, resorts, villas, homestays, hostels, serviced apartments, and other stay providers so the deployed product can support day-to-day property operations, payments, inventory, distribution, and operational intelligence.

The system should be launchable in slices, but the design target is the full program rather than a single PMS-only feature. Features can be opened for all vendors now and placed behind plan or admin payment walls later without re-architecting the core workflows.

## Program Scope

### Operational Surfaces Included

- PMS core
- payment and folio operations
- inventory and marketplace sync
- OTA and channel foundations
- AI pricing and forecasting
- guest operations and enterprise controls

### What “Real” Means In This Program

The program must avoid fake controls and false-live buttons.

For any capability presented as shipped, the deployed product must support:

- persistent storage
- real create or update flows where appropriate
- visible operational state
- admin or vendor workflows that can be manually tested
- error handling that surfaces failure clearly

Some enterprise-grade integrations may begin with manual control loops before becoming fully automated, but they still need real data models, state, and operable workflows.

## Execution Strategy

The platform should be built in vertical slices so every layer is deployable and testable without waiting for the whole system.

### Slice 1: PMS Core

- properties
- room types
- rooms
- reservations
- housekeeping tasks
- folio entries
- occupancy and readiness metrics

### Slice 2: Payment Operations

- folio settlement
- manual payment capture records
- payment approval and reconciliation workflows
- outstanding balance views
- night-audit-friendly billing summaries

### Slice 3: Inventory And Marketplace Sync

- PMS room availability reflected into Tripetrip stay inventory
- hold and block logic for inventory safety
- listing and stay mapping between Vendor OS and marketplace inventory
- sync visibility and error states for vendors and admins

### Slice 4: OTA And Channel Foundations

- channel mapping records
- outbound inventory and rate sync preparation
- inbound sync logs and conflict states
- manual retry and override controls
- adapter boundary for future OTA providers

### Slice 5: AI Pricing And Forecasting

- occupancy trend signals
- pricing suggestion engine
- demand forecasting surface
- anomaly and operational risk detection
- housekeeping prioritization recommendations

### Slice 6: Guest And Enterprise Operations

- guest identity and arrival workflow support
- digital pre-check-in rails
- multi-property operational views
- enterprise-grade approval and audit surfaces
- admin-controlled entitlement and payment walls

## Architecture

The accommodation operations program must extend the existing Vendor OS foundation rather than introduce a separate product architecture.

### Existing Foundation To Reuse

- Worker-backed Vendor OS mutation routes
- Supabase-backed tenant data model
- accommodation access resolution
- admin accommodation controls
- Vendor OS module routing and navigation
- audit and document infrastructure already present in Vendor OS

### Core Principle

Every new accommodation feature must fit into:

- the current tenant model
- the current Worker authorization path
- the current accommodation access wall
- the existing deploy path to Cloudflare Workers

This avoids creating a parallel stack that would be harder to govern and test.

## Domain Model

### Foundation Entities

The current `vendor_properties` model remains the accommodation anchor and is extended by:

- `vendor_room_types`
- `vendor_rooms`
- `vendor_pms_reservations`
- `vendor_housekeeping_tasks`
- `vendor_folio_entries`
- `vendor_payment_records`
- `vendor_inventory_mappings`
- `vendor_channel_connections`
- `vendor_channel_sync_logs`
- `vendor_pricing_signals`
- `vendor_forecasts`
- `vendor_guest_profiles`
- `vendor_guest_documents`

The exact rollout order follows the execution slices, but the design target should remain coherent from the start.

### PMS Core

#### Room Types

- property reference
- title
- code
- occupancy settings
- base rate
- description
- active flag

#### Rooms

- property reference
- room type reference
- room number or label
- floor or zone
- room status
- housekeeping status
- notes
- active flag

Room status values:

- `available`
- `occupied`
- `reserved`
- `dirty`
- `blocked`
- `maintenance`

Housekeeping status values:

- `clean`
- `dirty`
- `inspected`
- `in_progress`
- `out_of_service`

#### PMS Reservations

- property reference
- room reference
- guest reference or guest snapshot
- check-in date
- check-out date
- adults
- children
- reservation status
- payment status
- total amount
- source
- notes

Reservation status values:

- `reserved`
- `checked_in`
- `checked_out`
- `cancelled`
- `no_show`

Payment status values:

- `pending`
- `partially_paid`
- `paid`
- `refunded`

Source values for this phase direction:

- `manual`
- `tripetrip_direct`
- `channel`

#### Housekeeping Tasks

- room reference
- property reference
- title
- assigned staff name or assignee reference
- due timestamp
- task status
- priority
- notes

Task status values:

- `pending`
- `assigned`
- `in_progress`
- `done`
- `blocked`

Priority values:

- `low`
- `normal`
- `high`

#### Folio Entries

- reservation reference
- property reference
- entry type
- title
- amount
- quantity
- payment state
- notes
- posted timestamp

Entry type values:

- `room_charge`
- `tax`
- `addon`
- `discount`
- `payment`

Payment state values:

- `open`
- `posted`
- `settled`
- `void`

### Payment Operations

Payment operations should extend folios without pretending to be a full general ledger at first.

#### Payment Records

- reservation reference
- folio reference or folio grouping metadata
- payment method
- amount
- payment status
- reference number
- collected at timestamp
- collected by
- notes

Payment method values:

- `cash`
- `upi`
- `card`
- `bank_transfer`
- `manual_external`

Payment status values:

- `initiated`
- `pending_approval`
- `recorded`
- `failed`
- `reversed`

The design must support a later payment wall where some advanced payment features are plan-gated, but the operational payment model is built now.

### Inventory And Marketplace Sync

Inventory sync should make internal PMS state meaningful to public Tripetrip supply.

#### Inventory Mappings

- vendor property reference
- vendor room type or room reference
- public listing reference
- sync mode
- active flag
- last sync status
- last synced at timestamp

Sync mode values:

- `manual`
- `guarded_auto`

The first real implementation may begin with guarded availability updates rather than fully dynamic pricing sync.

### OTA And Channel Foundations

OTA support should begin with channel abstractions instead of hard-coding a single provider.

#### Channel Connections

- organization reference
- provider name
- credential metadata
- connection status
- enabled flag
- last verified at

Connection status values:

- `draft`
- `connected`
- `error`
- `paused`

#### Channel Sync Logs

- connection reference
- sync type
- direction
- status
- payload summary
- error summary
- created at

Sync type values:

- `inventory`
- `rates`
- `reservation`

Direction values:

- `outbound`
- `inbound`

Status values:

- `queued`
- `sent`
- `applied`
- `conflict`
- `failed`

### AI Pricing And Forecasting

AI surfaces must operate on real vendor data, not generic prompts alone.

#### Pricing Signals And Forecasts

- organization reference
- property reference
- signal date
- occupancy inputs
- booking pace inputs
- housekeeping pressure inputs
- forecast output
- suggested rate action
- anomaly summary

The first implementation can rely on deterministic local calculations plus optional LLM-assisted explanation. The system should not require AI availability to remain operational.

### Guest And Enterprise Operations

This layer should support future identity and enterprise workflows without blocking the current product.

#### Guest Profiles

- guest name
- email
- mobile number
- identity status
- stay history summary
- notes

#### Guest Documents

- guest reference
- reservation reference
- document type
- upload reference
- verification status

Identity status values:

- `not_started`
- `submitted`
- `verified`
- `rejected`

## User Experience

### Vendor Experience

Accommodation vendors should see a work-focused operating system with accommodation-specific flows visible and usable from the deployed site.

Key characteristics:

- practical, dense, operational layouts
- clear status indicators
- no fake feature marketing inside the app
- strong empty states when a section has no data yet
- ability to operate manually before turning on full automation

### Admin Experience

Admin should be able to:

- view vendor accommodation posture
- approve or manage manual payment workflows where needed
- monitor sync issues
- apply future plan restrictions without changing the underlying implementation
- audit what happened and who changed it

## Access Control And Commercial Walling

The program keeps the current principle:

- build the operational capabilities now
- apply payment walls, plan restrictions, or admin approvals later through the control layer

This means:

- accommodation access remains the central entitlement system
- module visibility and capability overrides continue to govern usage
- advanced features may be open at first
- later monetization should be configuration-driven rather than code-forked

## Error Handling

All slices should share the same quality bar:

- required fields fail fast with inline feedback
- invalid date ranges and state transitions are rejected cleanly
- sync conflicts are visible instead of silently swallowed
- AI failure degrades to non-AI operation, not a broken workspace
- channel issues log actionable states
- payment mismatches surface clearly to vendor and admin workflows where relevant

## Testing Strategy

Each slice must include:

- schema coverage
- Worker or API coverage where operation wiring changes
- component tests for real vendor workflows
- access enforcement tests
- manual verification steps suitable for deployed-site testing

The most important cross-cutting guarantees are:

- tenant scoping remains correct
- accommodation access still blocks disallowed actions
- marketplace-facing inventory does not oversell when PMS state blocks supply
- payment and folio states remain internally consistent
- AI surfaces never become single points of failure

## Rollout Documentation

The rollout documentation should be maintained continuously and must show:

- done
- in progress
- next
- deferred only where sequencing is necessary, not where the program intent is cancelled

The main status file remains:

- `docs/status/accommodation-rollout-status.md`

## Risks

- Trying to automate OTA and AI flows before the core PMS state is trustworthy will produce brittle results.
- Adding every slice in one large code drop would raise regression risk and make manual testing miserable.
- Payment walls added too early would slow operational validation; payment walls added too late without entitlement plumbing would create monetization debt.

## Recommendation

Build the accommodation operations program in the recommended operational-first sequence:

1. PMS core
2. payment operations
3. inventory and marketplace sync
4. OTA and channel foundations
5. AI pricing and forecasting
6. guest and enterprise operations

This keeps every new capability anchored to real operational data, makes the deployed site progressively more testable, and preserves a clean path for admin-controlled payment walls later.
