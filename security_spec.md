# Security Specification for Tripetrip

## 1. Data Invariants
- A profile must have a valid role ('traveler', 'vendor', or 'admin').
- A listing must belong to a valid vendor profile.
- A booking must reference a valid listing, traveler, and vendor.
- Only the user themselves can edit their `profiles/{userId}`.
- Vendors can only manage their own `vendor_profiles` and `listings`.
- Travelers and Vendors involved in a booking can view it.
- Timestamps (`createdAt`) must be server-generated.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Attempt to create a profile with a different `userId`. (Rejected)
2. **Role Escalation**: Attempt to update own role to 'admin'. (Rejected)
3. **Shadow Update**: Attempt to inject `isVerified: true` into a `vendor_profiles` update. (Rejected)
4. **Orphaned Listing**: Attempt to create a listing without a `vendor_id`. (Rejected)
5. **Junk ID**: Attempt to create a document with a 1.5KB string as ID. (Rejected)
6. **Future Timestamp**: Attempt to set `created_at` to a future date. (Rejected)
7. **Cross-Vendor Edit**: Vendor A attempting to update Vendor B's listing. (Rejected)
8. **Malicious Booking**: Traveler attempting to create a booking for another user. (Rejected)
9. **Terminal State Leap**: Attempting to move a booking from 'pending' directly to 'completed'. (Rejected)
10. **Immutable Field Write**: Attempting to change `vendor_id` on an existing listing. (Rejected)
11. **Large String Payload**: Attempting to set a 2MB description text. (Rejected)
12. **PII Leak**: Authenticated user attempting to 'get' another user's private profile data. (Rejected)

## 3. Test Runner (Internal Logic)
The rules will include `isValidProfile`, `isValidListing`, and `isValidBooking` helpers.
Every write operation will be gated by these blueprints and the `Master Gate` rules.
