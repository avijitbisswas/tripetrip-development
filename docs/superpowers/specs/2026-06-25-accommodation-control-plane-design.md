# Accommodation Control Plane Design

## Purpose

Tripetrip already has a broad Vendor OS foundation and an admin control plane, but accommodation providers still see a largely generic vendor workspace. This phase adds a structured control model for all accommodation service providers so the platform can expose the right operational modules, plan tiers, feature gates, and approval paths without hard-coding one-off logic per vendor.

The goal is to make accommodation vendors feel purpose-built from day one while giving admins secure, auditable control over what each vendor can access. For the first rollout, all features remain open by default, but the enforcement structure is introduced now so the launch surface stays stable when restrictions and paid tiers are enabled later.

## Scope

### Included In This Phase

- Accommodation provider family model spanning:
  - hotel
  - resort
  - villa
  - homestay
  - hostel
  - serviced apartment
  - boutique stay
- Vendor OS plan tiers for accommodation providers:
  - `basic`
  - `paid`
  - `advanced`
- Capability wall definitions at module and feature level.
- Admin-controlled vendor overrides for modules, features, and approvals.
- Accommodation-focused Vendor OS module filtering so irrelevant modules can be hidden or deprioritized.
- A launch-safe approval wall structure for sensitive actions.
- Persistent documentation that tracks what is done, in progress, and deferred.

### Explicitly Deferred

- Full OTA integration and production-grade CRS implementation.
- Real facial-recognition or biometric attendance flows.
- Real AI forecasting, anomaly detection, pricing optimization, or sentiment pipelines.
- Hardware/device integrations such as kiosks, IoT room-state sensors, and digital lock providers.
- Full enterprise-grade multi-property synchronization engine.

Those advanced workflows will be represented as capabilities and roadmap items now, but not falsely marked as complete.

## Product Model

### Provider Family

Existing `vendor_profiles.business_type` values will be normalized into an accommodation family. The family becomes the primary selector for accommodation-facing module bundles and admin policy.

Examples:

- `hotel`, `resort`, `boutique stay` -> accommodation family
- `villa`, `homestay`, `serviced apartment` -> accommodation family
- `hostel` -> accommodation family

This preserves current business data while allowing a clean control surface above it.

### Plan Model

Each accommodation vendor gets:

- one provider family: `accommodation`
- one plan tier: `basic`, `paid`, or `advanced`
- zero or more explicit capability overrides
- zero or more approval-policy overrides

Default rollout policy for this phase:

- all accommodation modules are visible
- all mapped capabilities are enabled
- approval walls are defined but not blocking by default

## Accommodation Module Map

The accommodation surface is organized into these modules:

1. `bookings_reservations`
2. `inventory_channel_management`
3. `checkin_checkout`
4. `billing_invoicing`
5. `housekeeping_room_readiness`
6. `staff_attendance`
7. `reporting_analytics`
8. `guest_experience`

These map to the user’s commercial matrix and sit on top of the existing Vendor OS shell. Existing generic modules such as PMS, Calendar, Analytics, Team, Marketplace, Settings, and AI Assistant remain implementation anchors, but the accommodation layer becomes the commercial and policy abstraction above them.

## Tier Definition

### Basic

- Centralized calendar
- Manual booking entry
- Guest profiles
- Manual inventory updates
- Basic channel manager
- Manual check-in / check-out
- Guest ID capture
- Manual billing
- Folio management
- Room status updates
- Task assignment
- Staff roles
- Manual attendance
- Occupancy and revenue reporting
- Manual guest communication

### Paid

- Online booking engine
- OTA / channel integration
- Group bookings
- Automated OTA sync
- Rule-based rate management
- Mobile check-in
- Digital key delivery integration hooks
- Automated GST billing
- Multi-currency support
- Integrated payments
- Mobile housekeeping workflow
- Automated task lists
- Shift scheduling
- Attendance logs
- Operational dashboards
- Trend analysis
- Automated confirmations
- Feedback collection
- Upsell offers

### Advanced

- AI chatbot booking assistant
- No-show prediction and automated follow-up
- Multi-property CRS foundation
- AI demand forecasting
- Dynamic pricing engine
- Real-time multi-property sync
- Facial-recognition check-in integration hook
- Contactless workflows
- Automated guest messaging
- Fraud detection
- Custom billing workflows
- Automated night audit
- Predictive housekeeping scheduling
- IoT-enabled room-state integration hook
- AI-driven task assignment
- Biometric or app-based attendance integration hook
- AI-driven shift optimization
- HR analytics
- Custom analytics
- AI-powered forecasting
- Anomaly detection
- WhatsApp / SMS automation
- Sentiment analysis
- AI-driven personalized upselling

Advanced items that are not yet technically implemented must stay marked as roadmap-backed capabilities, not shipped claims.

## Capability Wall

### Capability Shape

Each module exposes capabilities at a finer grain than plan tier.

Example capability keys:

- `bookings.manual_entry`
- `bookings.online_engine`
- `bookings.ai_chatbot`
- `inventory.ota_sync`
- `inventory.dynamic_pricing`
- `checkin.mobile`
- `billing.gst_invoice`
- `housekeeping.predictive_schedule`
- `staff.biometric_attendance`
- `analytics.anomaly_detection`
- `guest.whatsapp_automation`

### Resolution Order

Capabilities resolve in this order:

1. hardcoded defaults for the accommodation family
2. plan-tier defaults
3. vendor-specific admin overrides
4. branch-specific overrides later, when introduced

This allows global consistency with targeted exceptions.

## Approval Wall

Sensitive actions must support policy enforcement even when they are open in the first rollout.

Approval-aware actions:

- pricing and rate-rule changes
- marketplace publishing / unpublishing
- payout-sensitive billing actions
- refund-sensitive booking actions
- automated guest messaging campaigns
- AI-generated recommendations that modify commercial state

Policy shape:

- `open`
- `vendor_owner_only`
- `admin_approval_required`

Default for this phase: `open`

The UI must still show policy state clearly so admins understand what is currently permissive and what can be tightened later.

## Admin Control Surface

Admin needs one accommodation-focused control workspace with these functions:

- assign or confirm provider family
- assign plan tier
- toggle module visibility
- toggle feature capabilities
- set approval policies
- inspect current effective access
- review audit history of plan/capability changes

This extends the existing `/admin` console rather than creating a separate, disconnected back office.

## Data Model

This phase should add persistent control records rather than burying capability state in ad hoc JSON blobs only.

### New or Extended Records

#### `vendor_os_plan_assignments`

- `id`
- `vendor_profile_id`
- `provider_family`
- `plan_tier`
- `is_active`
- `assigned_by`
- `created_at`
- `updated_at`

#### `vendor_os_capability_overrides`

- `id`
- `vendor_profile_id`
- `provider_family`
- `capability_key`
- `enabled`
- `reason`
- `created_by`
- `created_at`
- `updated_at`

#### `vendor_os_approval_policies`

- `id`
- `vendor_profile_id`
- `provider_family`
- `policy_key`
- `mode`
- `created_by`
- `created_at`
- `updated_at`

The existing admin audit log should capture all writes to these records.

## Vendor OS Behavior

### Navigation

Accommodation vendors should see an accommodation-first workspace. Relevant modules remain prominent, while non-accommodation modules are hidden or deprioritized based on provider family and capability state.

Likely visible first-wave modules:

- Dashboard
- Bookings / Calendar
- PMS / Check-in
- Housekeeping
- Billing
- Team
- Analytics
- Guest Experience
- Marketplace
- Settings

### Module UX

Each module should expose:

- current plan tier
- capability availability
- approval policy status
- roadmap state for deferred advanced features

If a feature is not yet implemented, the UI must say it is planned or coming later rather than pretending the action works.

## Documentation and Delivery Tracking

The rollout must maintain a live status document with these sections:

- `Done`
- `In Progress`
- `Next`
- `Deferred`
- `Notes / Risks`

This document is part of the delivery itself, not an afterthought.

Recommended files:

- `docs/superpowers/specs/2026-06-25-accommodation-control-plane-design.md`
- `docs/superpowers/plans/2026-06-25-accommodation-rollout-plan.md`
- `docs/status/accommodation-rollout-status.md`

## Testing Strategy

Testing should scale with the control-plane risk:

- unit tests for capability resolution
- unit tests for provider-family normalization
- unit tests for approval-policy enforcement
- admin API tests for plan assignment and override writes
- Vendor OS UI tests for accommodation module visibility
- integration tests for “all open by default” rollout behavior

The first implementation must prove:

- accommodation vendors still retain access after rollout
- admin changes take effect deterministically
- unsupported modules are not falsely presented as live operational workflows

## Rollout Strategy

### Phase 1

- provider family normalization
- plan/tier records
- capability registry
- approval policy registry
- admin controls
- Vendor OS navigation filtering
- live rollout status document

### Phase 2

- real accommodation workflow depth for bookings, billing, housekeeping, guest operations, and analytics

### Phase 3

- advanced AI / enterprise automations and integrations

## Risks

- Mixing commercial packaging with operational permissions too early can create hidden coupling if the capability registry is not explicit.
- Reusing generic Vendor OS modules without accommodation-specific framing can leave the product feeling unfinished even if access logic is correct.
- Marking advanced features as “available” before the backend exists would damage launch trust.

## Recommendation

Build the accommodation control model first, keep the first rollout permissive, document every delivered and deferred item, and let the control layer drive future module work. This gives Tripetrip a secure, admin-governed commercial foundation without destabilizing the current Vendor OS.
