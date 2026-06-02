# Thrill Zone Design

## Scope

Build a premium Tripetrip adventure marketplace called "Thrill Zone" following the supplied reference screenshot and requirements. The experience covers four user-facing states:

- Adventure listing marketplace
- Adventure detail page
- Mobile-first detail experience
- Booking confirmation with adventure pass

The product is a direct-booking marketplace for verified operators across trekking, scuba diving, river rafting, paragliding, bungee jumping, ATV rides, desert safari, skiing, zipline, surfing, wildlife safari, and camping.

## Visual Direction

The design should stay close to the provided composition: Airbnb Experiences clarity, Red Bull energy, and Apple-like spacing and polish. The base is white with emerald green as the primary action color. Cards use soft glassmorphism, large radius, subtle borders, and gentle shadows. Photography must be prominent and realistic, with adventure imagery driving the page instead of decorative graphics.

Key visual requirements:

- White page background with restrained emerald accents
- Large cinematic hero imagery for mountains, paragliding, diving, rafting, snow, desert, and forest experiences
- Premium search bar layered over the listing hero
- Trust badges beneath the hero
- Dense but polished marketplace grid with four cards per desktop row
- Mobile experience optimized around imagery, booking, safety, and reviews
- Sticky booking actions on detail and mobile views

## Listing Page

The listing page shows a full-width hero with mountain trekking and paragliding imagery, the title "Thrill Zone", the subheading "Adventure experiences from verified local operators.", a premium search bar, and trust badges for verified operators, safety standards, instant booking, and direct prices.

Below the hero, a left filter panel offers activity type, difficulty, duration, price range, and safety rating. The main area shows adventure cards in a four-column desktop grid with image zoom and lift interactions. Each card includes image, activity, location, operator, difficulty, duration, safety rating, reviews, original price, direct booking price, save badge, and instant book badge.

Seed examples include Paragliding Bir Billing, Scuba Diving Andaman, Rishikesh River Rafting, Goa ATV Adventure, Kashmir Ski Experience, Dubai Desert Safari, Bungee Jumping Rishikesh, Camping Manali, Wildlife Safari Jim Corbett, Zipline Wayanad, Surfing Kovalam, and Trekking Kedarkantha.

## Detail Page

The detail page uses an immersive hero gallery with video preview affordance. The overview includes activity name, location, operator, rating, total bookings, verified operator badge, and safety certified badge.

A right sticky booking panel includes price per person, date, slot, participants, total amount, Book Now, and Contact Operator. The content includes description, highlights, requirements, what to bring, meeting point, itinerary timeline, safety details, reviews with photos, operator profile, and similar experiences carousel.

Advanced marketplace details appear as compact product features: live availability, remaining slots, weather forecast, AI recommendations, safety score, map/location cue, insurance add-on, group discounts, and photo/video package add-on.

## Mobile Detail Experience

The mobile page prioritizes adventure imagery first, then title, trust badges, booking controls, timeline, safety, and reviews. It includes a sticky Book Now button or bottom booking bar. Controls must remain thumb-friendly and avoid crowded text.

## Booking Confirmation

The confirmation screen shows a success animation treatment, "Booking Confirmed", an adventure pass, booking ID, QR code-style pass block, Download Ticket, Chat With Operator, and Add To Calendar actions.

## Architecture

Use the existing React, Vite, React Router, lucide-react, and CSS setup. Keep implementation local to page/data/style files unless existing routing requires integration changes.

Recommended structure:

- Shared adventure data in `src/data/tripetripAdventures.ts`
- Listing experience in `src/pages/Activities.tsx` or the existing activities route
- Detail experience in `src/pages/ListingDetail.tsx`
- Confirmation experience in `src/pages/BookingConfirmation.tsx`
- Global visual styles in `src/index.css`

The data is static/demo-grade for this UI build, with clear fields for future backend wiring.

## Testing And Verification

Verification should include:

- TypeScript check through the existing lint script
- Production build
- Targeted marketplace tests if the existing test suite already covers navigation or rendering
- Manual screenshot check on desktop and mobile if the dev server can run locally

## Non-Goals

This build does not implement real payments, live operator inventory, real map tokens, real weather APIs, real AI recommendations, or production QR generation. These are represented as premium UI affordances ready for future service integration.
