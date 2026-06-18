# Community Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the More navigation/page with a role-isolated, Twitter-like community feed and profile page for travelers and vendors.

**Architecture:** Store community posts in the existing `messages` table with an internal community marker, while Worker API endpoints verify the caller's Supabase bearer token, read the caller's profile role, and only return or create posts for that role. Add React community pages that render a composer, feed, and profile timeline using those Worker endpoints.

**Tech Stack:** React, React Router, Supabase, Cloudflare Worker, Vitest, Tailwind.

---

### Task 1: Backend Community API

**Files:**
- Modify: `worker/index.ts`
- Modify: `worker/index.test.ts`
- Modify: `supabase_schema.sql`

- [ ] Add failing Worker tests for: unauthenticated requests returning `401`, same-role feed reads returning posts, and post creation assigning the authenticated user's role.
- [ ] Use the existing `messages` table for persistence so no new Supabase migration is required.
- [ ] Implement `/api/community/posts` GET and POST in `worker/index.ts`.
- [ ] Implement `/api/community/profile/:userId` GET in `worker/index.ts`.
- [ ] Run `npm test -- worker/index.test.ts` and `npm run lint`.

### Task 2: Frontend Community Services

**Files:**
- Create: `src/services/community.ts`

- [ ] Add a small API client that reads the Supabase session token and calls the Worker endpoints.
- [ ] Return typed community posts and profiles for page components.
- [ ] Surface friendly errors when the user is not logged in or the table is not deployed.

### Task 3: Community UI

**Files:**
- Create: `src/pages/Community.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/Layout.test.tsx`
- Modify: `src/pages/tripetrip-marketplace.test.tsx`

- [ ] Replace `More` nav with `Community`.
- [ ] Route `/community` to the feed and `/community/profile/:userId` to the profile timeline.
- [ ] Redirect old `/more` URLs to `/community`.
- [ ] Build a modern feed with composer, posts, role context, and profile links.
- [ ] Build a profile mode that shows profile summary and that user's posts.
- [ ] Run focused tests, `npm run lint`, `npm run build`, and `npx wrangler deploy --dry-run`.

### Task 4: Deploy

**Files:**
- All changed files

- [ ] Commit the implementation.
- [ ] Push `supabase-migration`.
- [ ] Verify `/api/config/health`, `/community`, and community post creation after Cloudflare deploys.
