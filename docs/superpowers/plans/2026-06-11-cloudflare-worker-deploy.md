# Cloudflare Worker Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Vite SPA and `/api/*` backend through one Cloudflare Worker with static assets.

**Architecture:** Keep the existing Express `server.ts` for local Node development, and add a Worker entry at `worker/index.ts` for production. The Worker handles API routes directly and delegates all non-API requests to Cloudflare static assets with SPA fallback configured in Wrangler.

**Tech Stack:** Vite, React, TypeScript, Cloudflare Workers Static Assets, Wrangler, Vitest, Supabase JS, Resend HTTP API.

---

### Task 1: Worker API Runtime

**Files:**

- Create: `worker/index.ts`
- Test: `worker/index.test.ts`

- [ ] **Step 1: Write tests for Worker route behavior**

Create `worker/index.test.ts` with tests for `/api/health`, static asset fallback, Cloudinary signing, and email dispatch via `fetch`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- worker/index.test.ts`
Expected: fail because `worker/index.ts` does not exist.

- [ ] **Step 3: Implement Worker routes**

Create `worker/index.ts` with route dispatch for the existing API endpoints, Web Crypto SHA-1 Cloudinary signing, Resend HTTP API calls, Gemini fetch, Supabase service client setup, payments, deal booking, and admin payment actions.

- [ ] **Step 4: Run Worker tests**

Run: `npm test -- worker/index.test.ts`
Expected: pass.

### Task 2: Wrangler Deployment Config

**Files:**

- Create: `wrangler.jsonc`
- Modify: `package.json`

- [ ] **Step 1: Add Wrangler config**

Create `wrangler.jsonc` with `main = worker/index.ts`, `assets.directory = ./dist`, `assets.not_found_handling = single-page-application`, `assets.binding = ASSETS`, and `assets.run_worker_first = ["/api/*"]`.

- [ ] **Step 2: Add deployment scripts and dependency**

Add `wrangler` to dev dependencies and add scripts for `deploy`, `cf:deploy`, and `cf:dev`.

- [ ] **Step 3: Verify type/build compatibility**

Run: `npm install`
Run: `npm run lint`
Run: `npm run build`

### Task 3: GitHub Actions Worker Deploy

**Files:**

- Modify: `.github/workflows/cloudflare-pages-deploy.yml`
- Modify: `README.md`

- [ ] **Step 1: Replace Pages deploy action**

Update the workflow to build and run `cloudflare/wrangler-action@v3` with `command: deploy`.

- [ ] **Step 2: Update docs**

Document Worker deployment secrets and runtime secrets.

- [ ] **Step 3: Verify workflow formatting**

Run: `npx --yes prettier --check .github/workflows/cloudflare-pages-deploy.yml README.md`

### Task 4: Final Verification

**Files:**

- Check all modified files.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- worker/index.test.ts`

- [ ] **Step 2: Run full validation**

Run: `npm run lint`
Run: `npm run build`

- [ ] **Step 3: Inspect git diff**

Run: `git diff --stat`
Run: `git status --short --branch`
