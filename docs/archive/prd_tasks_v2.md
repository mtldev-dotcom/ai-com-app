# **Step-by-Step Build Plan (v2)**

*For AI coding agents of the “Nick a Deal – AI Admin” project*

Each step contains tasks \+ Testing & Validation Flow. Agents must **not exceed** the specified tasks in each step, must place files correctly, obey Windows-compatible command rules, and await user approval before proceeding.

---

## **Step 0 – Project Scaffold & Ruleset**

**Goal:** Set up base repo \+ rules file.

### **Tasks**

1. Create the folder structure at repo root:

   * `docs/` (documentation)

   * `.dev/` (internal notes & assets)

   * `ai-com-app/` (Next.js 15 app)

2. Inside `docs/`, create `cursor-rules.md` (agent rules file) and other placeholder docs.

3. Initialize `ai-com-app/` folder with `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, and `src/` folder with subfolders (`app/`, `components/`, `lib/`, `db/`, `workers/`, `types/`).

4. Add `.env.example` at root with placeholder values.

5. Add `.gitignore` with typical Next.js \+ Node entries.

### **Testing & Validation**

* Verify folders exist: `docs/`, `.dev/`, `ai-com-app/`.

* `docs/cursor-rules.md` exists and contains agent guideline summary.

* `ai-com-app/` top-level config files exist.

* `.env.example` and `.gitignore` present.

* No other code or dependencies installed yet.  
   **Once validated → proceed to Step 1\.**

---

## **Step 1 – Database & ORM Setup**

**Goal:** Define schema including new token & sync tables.

### **Tasks**

1. Add Postgres URL in `.env.example`.

2. Choose ORM (e.g., Drizzle or Prisma).

3. Create migrations/schema for tables: users, suppliers, products\_draft, variants\_draft, imports, medusa\_sync\_jobs, api\_tokens, token\_usage\_logs, settings.

4. Add seed data for suppliers, sample token entries.

### **Testing & Validation**

* Run migration (instruction only) and verify tables exist via client or SQL tool.

* Query `api_tokens` returns seeded token.

* Query `medusa_sync_jobs` schema exists with correct columns.

* Confirm foreign keys: `token_usage_logs.token_id` references `api_tokens.id`.  
   **Once validated → Step 2\.**

---

## **Step 2 – Auth, Session & Roles**

**Goal:** Secure access and user roles.

### **Tasks**

1. Setup Supabase Auth (or NextAuth) for login/register.

2. Create role system: owner, manager, editor, viewer. Enforce role in UI routes.

3. Protect routes: `/dashboard`, `/drafts`, `/imports`, `/settings`, `/tokens`.

4. Create context hook `useUser()` exposing user and role to components.

### **Testing & Validation**

* Register → login → access dashboard.

* Logout → redirect to login.

* Editor role cannot access Settings or token management.

* Viewer role has read-only access.  
   **Upon validation → Step 3\.**

---

## **Step 3 – Dashboard Layout & Navigation**

**Goal:** Build UI shell with navigation and theme toggle.

### **Tasks**

1. Implement Shadcn UI Sidebar, Topbar, ThemeToggle.

2. Add navigation links to pages: Dashboard, Drafts, Imports, Suppliers, Monitoring, Tokens, Settings, Docs.

3. Add responsive layout & track active route highlight.

### **Testing & Validation**

* Click each nav link → correct page view loads (even if stub).

* Theme toggle persists (e.g., localStorage).

* UI handles mobile/responsive view.  
   **Once okay → Step 4\.**

---

## **Step 4 – Settings & Medusa Store Connection**

**Goal:** Allow user to connect their Medusa store and manage tokens.

### **Tasks**

1. Create `/settings` page: form to input `MEDUSA_ADMIN_URL`, `MEDUSA_ADMIN_TOKEN`. Store securely in DB (`settings` table).

2. Token management section: list existing tokens (provider: medusa, openai, gemini) with decrypted/hidden values, active toggle. Add “Add Token” form.

3. Set up API route: `POST /api/tokens` – add new token. `GET /api/tokens` – list tokens.

4. Add token usage logs UI: `/tokens/usage` page, filter by provider and date range.

### **Testing & Validation**

* Enter Medusa store URL \+ token → saved persistently.

* Add new AI/Medusa provider token → token listed, active \= true.

* Navigate to token usage page → initially empty, filtering works.

* Attempt to access settings/ tokens as viewer role → denied.  
   **Once validated → Step 5\.**

---

## **Step 5 – Imports & Medusa Sync Module**

**Goal:** Support CSV/URL import \+ Medusa sync (products, categories, collections, types, tags, sales channels).

### **Tasks**

1. `/imports` page: upload CSV/XLSX or specify Medusa sync config (entity type, sync interval).

2. Import mapping wizard: map columns to fields; for Medusa sync config provide entity type \+ operation (fetch from store).

3. Persist `imports` and `medusa_sync_jobs` entries. API routes: `POST /api/imports`, `POST /api/sync`.

4. Implement pull logic: for Medusa sync jobs trigger fetch endpoint `/admin/{entity}` for entities: products, product\_categories, collections, product\_types, product\_tags, sales\_channels. (Ref: \[Medusa V2 Admin API Reference\][docs.medusajs.com](https://docs.medusajs.com/api/admin?utm_source=chatgpt.com))

5. Implement basic create/update/delete interface: from Import UI, allow user to mark items for delete or update back to Medusa store.

### **Testing & Validation**

* Upload sample CSV → mapping wizard loads → create draft entries.

* Configure Medusa sync for categories → a sync job entry created → fetch runs (stub) and populates DB.

* Ensure operations logged in `medusa_sync_jobs` with statuses.

* User can trigger update from imported item → call to Medusa Admin API stub or placeholder liaison.  
   **Validated → Step 6\.**

---

## **Step 6 – Draft Management & Product Sync Lifecycle**

**Goal:** Manage draft entities and sync/publish to Medusa.

### **Tasks**

1. `/drafts` list page: show drafts with status, supplier, margin, imported date.

2. `/drafts/[id]` detail page: FR/EN editors, attributes, images gallery, price calc component, Publish button (for new) or Sync button (for updates).

3. API route: `POST /api/drafts/:id/publish` → calls Medusa Admin API endpoint `/admin/products` (see docs) to create product \+ variants \+ metadata. (\[Medusa Admin API\][docs.medusajs.com](https://docs.medusajs.com/api/admin?utm_source=chatgpt.com))

4. For update/delete: support sync back to Medusa store via `PUT /admin/products/:id`, `DELETE /admin/products/:id`. Log operations in `medusa_sync_jobs`.

### **Testing & Validation**

* Create draft manually → validate fields save in DB.

* Click Publish → Medusa API call stub → `medusa_product_id` saved, status becomes ‘published’.

* Edit an existing published draft → Sync button triggers update.

* Delete draft or sync deletion → job logged.  
   **Validated → Step 7\.**

---

## **Step 7 – Token Usage Monitoring & Reporting**

**Goal:** Track provider token usage, provide analytics.

### **Tasks**

1. On every provider token-based operation (AI enrich, import, sync), log usage: `token_usage_logs(token_id, provider, process_name, used_at, record_count, details)`.

2. UI: Dashboard widget showing token usage by provider (last 7 days) and `/tokens/usage` page with filter by date and provider.

3. API routes: `GET /api/tokens/usage?provider=openai&from=2025-10-01&to=2025-10-31`.

### **Testing & Validation**

* After running AI enrich (simulate), a `token_usage_logs` entry appears.

* Dashboard chart updates accordingly.

* Usage filter returns correct logs.  
   **Validated → Step 8\.**

---

## **Step 8 – Pricing & Monitoring Jobs**

**Goal:** Monitor margins, price deltas, and apply rules.

### **Tasks**

1. Define scheduled job (`monitoring` queue) to run daily: compute margin for each published draft/product, compare against `price_rules`, generate alert if delta \> threshold.

2. UI: `/monitoring` page lists alerts: product, current margin, delta, status (new, reviewed, resolved).

3. Price Rules UI: `/settings/price-rules` page listing rules, allow create/update/delete.

4. API: `GET /api/monitoring/alerts`, `POST /api/price-rules`, `PUT /api/price-rules/:id`.

### **Testing & Validation**

* Seed price rule (e.g., target\_margin\_pct=50).

* Simulate cost/price change → job runs → alert appears.

* User config changes rule → job respects new rule.  
   **Validated → Step 9\.**

---

## **Step 9 – Documentation Suite**

**Goal:** Build internal documentation resources.

### **Tasks**

1. Under `docs/`, create:

   * `user-guide.md` – how to use the app (for end-users).

   * `developer-guide.md` – code structure, conventions, folder layout.

   * `contributor-guide.md` – coding standards, commit/branch policy.

   * `ai-agent-instructions.md` – instructions for Cursor/Claude agents (step rules, naming, tests, limitations).

2. Link all docs in `/docs/README.md` with table of contents.

3. Create design reference: `docs/design-system.md` (colors, typography, spacing).

### **Testing & Validation**

* Open each doc → headings exist, table of contents present.

* README links to all doc files.

* All docs follow markdown conventions (front-matter optional, consistent headings).  
   **Validated → Step 10\.**

---

## **Step 10 – QA, Build & Deployment**

**Goal:** Finalize QA, prepare for deployment, including full documentation and job scheduling.

### **Tasks**

1. Run validation checklist for all previous steps → verify each feature.

2. Create `docker-compose.yml` (web \+ db \+ redis \+ worker) in root.

3. Create `deployment.md` in `docs/` with instructions: dev vs prod, update flow, maintenance, backups, Medusa store connection.

4. Final code freeze: tag `v1.0-beta`.

### **Testing & Validation**

* `docker-compose up` (instruction only) should not error (no actual command by agent).

* Read `deployment.md` → contains steps for update, backups, migrations.

* All UI pages accessible, token flows, import flows, sync flows tested manually.  
   **Once done → Hand off to user for final review and production launch.**

---

### **🔄 Coding Consistency & Agent Behavior Rules (Reminder)**

* Each step must be executed **in order**; do not skip.

* Place files only within the correct directory (see Step 0 structure).

* Use Windows-compatible operations; do **not** chain shell commands with `&&`.

* Agents must **not** run or commit `npm install`, `npm run dev`, `build`, `delete` commands without user explicit permission.

* Create unit tests for all pure logic functions (especially token usage, price calc).

* Write commit messages: `feat(step-X): description` or `fix(step-X): description`.

* After each step, output: files created/modified, summary of tests, any blockers.

* Wait for user approval before moving to next step.
