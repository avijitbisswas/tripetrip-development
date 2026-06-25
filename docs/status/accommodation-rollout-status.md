# Accommodation Rollout Status

## Done

- Design approved for accommodation provider family rollout.
- Control model defined for provider family, plan tiers, capability wall, and approval wall.
- Documentation strategy defined for spec, plan, and delivery-status tracking.
- Accommodation access domain model added in Vendor OS code.
- Worker-backed accommodation access endpoints added for admin and vendor use.
- Admin console accommodation controls added for plan tier, enforcement mode, module overrides, and approval policies.
- Vendor OS tenant access now filters modules for accommodation providers.

## In Progress

- Verification, polish, and test stabilization for phase-one accommodation rollout.

## Next

- Add deeper module-level accommodation feature surfacing inside PMS, calendar, analytics, and guest workflows.
- Expand admin controls to capability-level toggles if needed beyond module and approval policy scope.
- Add stronger backend enforcement paths for advanced capability locks where direct Supabase writes still bypass UI controls.

## Deferred

- Real OTA integrations
- AI forecasting and anomaly detection
- Digital key / kiosk / biometric integrations
- Multi-property CRS
- Predictive housekeeping and IoT room-state integration

## Notes / Risks

- Phase 1 should remain permissive by default so launch behavior does not regress.
- Deferred advanced features must remain documented as roadmap-backed, not falsely shipped.
- Status file should be updated at each implementation checkpoint.
