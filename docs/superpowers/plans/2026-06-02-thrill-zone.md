# Thrill Zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Tripetrip "Thrill Zone" premium adventure marketplace across listing, detail, mobile detail, and booking confirmation screens.

**Architecture:** Use static adventure marketplace data to power the existing React routes. Replace the current lightweight activities/package UI with a dedicated adventure dataset, premium marketplace components inside the page files, and responsive CSS/Tailwind utility layouts.

**Tech Stack:** React 19, Vite, React Router 7, TypeScript, shadcn UI primitives, lucide-react, Tailwind CSS v4 utilities.

---

## File Map

- Create `src/data/tripetripAdventures.ts`: typed demo data, format helpers, filter lists, itinerary, safety, reviews, operator profile, add-ons, and similar experience data.
- Modify `src/pages/Activities.tsx`: implement the desktop listing hero, search bar, filters, trust badges, four-column card grid, mobile card stack, and direct booking marketplace cues.
- Modify `src/pages/ListingDetail.tsx`: switch from package data to adventure data and build gallery, overview, sticky booking panel, timeline, safety, reviews, operator profile, and similar experiences.
- Modify `src/pages/BookingConfirmation.tsx`: convert voucher confirmation into adventure pass confirmation with QR-style pass, ticket actions, and operator chat.
- Modify `src/index.css`: add small reusable effects for premium hover, glass cards, and mobile-safe sticky spacing only if utility classes become too repetitive.
- Modify `src/pages/tripetrip-marketplace.test.tsx`: adjust existing route smoke tests to assert Thrill Zone content.

## Task 1: Adventure Data

**Files:**
- Create: `src/data/tripetripAdventures.ts`

- [ ] **Step 1: Create typed data**

Add `AdventureExperience`, `AdventureReview`, and `AdventureOperator` types. Export `adventures`, `featuredAdventure`, `activityFilters`, `difficultyFilters`, `durationFilters`, `safetyFilters`, `trustBadges`, `formatRupees`, and `findAdventure`.

- [ ] **Step 2: Include seed experiences**

Create at least 12 experiences: Paragliding Bir Billing, Scuba Diving Andaman, Rishikesh River Rafting, Goa ATV Adventure, Kashmir Ski Experience, Dubai Desert Safari, Bungee Jumping Rishikesh, Camping Manali, Wildlife Safari Jim Corbett, Zipline Wayanad, Surfing Kovalam, and Kedarkantha Trekking.

- [ ] **Step 3: Add detail content**

For the featured adventure, include gallery images, video preview flag, itinerary, highlights, requirements, what to bring, meeting point, safety details, weather, live availability, add-ons, operator stats, and reviews.

## Task 2: Listing Page

**Files:**
- Modify: `src/pages/Activities.tsx`

- [ ] **Step 1: Replace current activity list**

Import the adventure data and lucide icons. Render a `main` with a cinematic hero, "Thrill Zone" heading, exact supplied subheading, premium search controls, and trust badges.

- [ ] **Step 2: Add filter panel**

Render left filters for activity type, difficulty, duration, price range, and safety rating. Use checkboxes, star labels, and an emerald slider track treatment.

- [ ] **Step 3: Add adventure card grid**

Render a responsive grid that reaches four cards per row on large desktop. Each card includes image, activity, location, operator, difficulty badge, duration, safety rating, reviews, original price, direct price, save badge, instant book badge, and quick preview on hover.

- [ ] **Step 4: Add marketplace footer band**

Add a premium "Book Direct & Save More" band matching the reference screenshot.

## Task 3: Detail Page

**Files:**
- Modify: `src/pages/ListingDetail.tsx`

- [ ] **Step 1: Switch to adventure dataset**

Use `findAdventure(id)` and default to the featured adventure when an unknown id is supplied. Similar experiences come from other adventure records.

- [ ] **Step 2: Build hero gallery**

Render large image, video play affordance, thumbnail strip, and mobile-friendly hero overlay actions.

- [ ] **Step 3: Build overview and sticky booking panel**

Render title, location, operator, rating, bookings, verified badges, price per person, date, slots, participants, total, Book Now, Contact Operator, remaining slots, and direct-save messaging.

- [ ] **Step 4: Build content sections**

Render About, Highlights, Requirements, What To Bring, Meeting Point, Itinerary timeline, Safety, Reviews with customer photos, Operator Profile, Similar Experiences, Weather Forecast, AI Recommendations, Insurance add-on, Group Discounts, and Photo & Video Package add-on.

- [ ] **Step 5: Build mobile booking bar**

Add a sticky bottom Book Now bar for mobile with price, save badge, and direct link to `/booking-confirmed`.

## Task 4: Booking Confirmation

**Files:**
- Modify: `src/pages/BookingConfirmation.tsx`

- [ ] **Step 1: Convert to adventure pass**

Render success animation treatment, "Booking Confirmed", "Adventure Pass", booking ID, QR-style pass block, operator and slot details.

- [ ] **Step 2: Add confirmation actions**

Add Download Ticket, Chat With Operator, Add To Calendar, and Explore More Adventures actions.

- [ ] **Step 3: Add safety next steps**

Show confirmation sent, operator chat, weather reminder, safety briefing, and meeting point checklist.

## Task 5: Verification

**Files:**
- Modify: `src/pages/tripetrip-marketplace.test.tsx`

- [ ] **Step 1: Update route assertions**

Assert that `/activities` renders "Thrill Zone", "Verified Operators", and a known activity card.

- [ ] **Step 2: Add detail assertion**

Assert that `/listing/paragliding-bir-billing` renders "Paragliding in Bir Billing", "Safety Certified", and "Book Now".

- [ ] **Step 3: Add confirmation assertion**

Assert that `/booking-confirmed` renders "Adventure Pass", "Booking Confirmed", and "Download Ticket".

- [ ] **Step 4: Run verification**

Run `npm run lint`, `npm test -- --run src/pages/tripetrip-marketplace.test.tsx`, and `npm run build`. Expected result: all commands pass.

## Self-Review

- Spec coverage: listing, detail, mobile, confirmation, and advanced feature UI are covered.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: data helper names are defined before page usage.
