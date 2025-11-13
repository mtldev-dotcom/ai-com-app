# Step-by-Step Build Plan (v2) - Restructured

*For AI coding agents of the "Nick a Deal – AI Admin" project*

This document restructures the build plan to reflect:
- **Completed steps** (Steps 0-8 from original prd.md)
- **Remaining original steps** (Steps 9-11)
- **New v2 features** from prd_v2.md (token management, Medusa sync, enhanced settings, documentation, research, FX conversion, etc.)

Each step contains tasks + Testing & Validation Flow. Agents must **not exceed** the specified tasks in each step, must place files correctly, obey Windows-compatible command rules, and await user approval before proceeding.

---

## ✅ **COMPLETED STEPS (Steps 0-8)**

The following steps have been completed and are documented for reference:

- **Step 0** – Project Scaffold & Ruleset ✅
- **Step 1** – Database & ORM Setup ✅ (basic tables: users, suppliers, products_draft, variants_draft, imports)
- **Step 2** – Auth & User Session ✅
- **Step 3** – Dashboard Layout & Navigation ✅
- **Step 4** – Imports Module (CSV/URL) ✅
- **Step 5** – AI Enrichment Functions ✅
- **Step 6** – Draft Management UI ✅
- **Step 7** – Medusa Admin API Integration (publish) ✅
- **Step 8** – Supplier Management ✅

---

## **Step 9 – Database Schema Extensions (v2 Tables)**

**Goal:** Add new tables required for v2 features: token management, Medusa sync, price monitoring, settings, audit logs.

### **Tasks**

1. Create schema files for new tables:
   - `api_tokens` (id, provider ENUM['openai','gemini','medusa'], token_value_encrypted, created_at, expires_at, active)
   - `token_usage_logs` (id, token_id FK, provider, process_name, used_at, record_count, details_jsonb)
   - `medusa_sync_jobs` (id, entity_type ENUM['product','category','collection','type','tag','sales_channel'], operation ENUM['fetch','create','update','delete'], status, started_at, completed_at, record_count, log_text)
   - `settings` (id, key, value_jsonb, created_at, updated_at)
   - `price_rules` (id, rule_name, target_margin_pct, min_margin_pct, rounding_rule, currency_preference, active)
   - `price_checks` (id, product_draft_id FK, supplier_price_amount, supplier_price_currency, selling_price_amount, selling_price_currency, margin_pct, delta_pct, observed_at)
   - `images` (id, product_draft_id FK, src_url, alt_en, alt_fr, width, height, storage_key, sort_order)
   - `audit_logs` (id, actor_id, action, target_table, target_id, diff_jsonb, created_at)
   - `supplier_scores` (id, supplier_id FK, score_type ENUM['quality','speed','support','price','reliability'], value INT 0-100, rationale, created_by, created_at)

2. Add proper indexes: `token_usage_logs(token_id, used_at desc)`, `medusa_sync_jobs(entity_type, status)`, `products_draft(title_en, title_fr, tag_ids GIN, status)`.

3. Update existing `users` table to include `role` ENUM['owner','manager','editor','viewer'] and `locale`.

4. Generate and apply migration.

### **Testing & Validation**

- Verify all new tables exist via database client.
- Confirm foreign keys: `token_usage_logs.token_id` → `api_tokens.id`, `supplier_scores.supplier_id` → `suppliers.id`.
- Check indexes are created.
- Query each table schema matches specification.

**Once validated → proceed to Step 10.**

---

## **Step 10 – Token Management System**

**Goal:** Implement per-provider token management with encrypted storage and usage logging.

### **Tasks**

1. Create encryption utility: `lib/encryption.ts` for token encryption/decryption (use environment key).

2. Create API routes:
   - `POST /api/tokens` – add new token (provider, encrypted value, expires_at, active)
   - `GET /api/tokens` – list all tokens (mask values, show provider/status)
   - `PUT /api/tokens/:id` – update token (active toggle, expires_at)
   - `DELETE /api/tokens/:id` – soft delete token
   - `GET /api/tokens/usage` – query usage logs with filters (provider, date range, process_name)

3. Create token usage logging helper: `lib/tokens/log-usage.ts` – function to log token usage after each provider call.

4. Create UI pages:
   - `/tokens` – list tokens table with provider, status, last used, actions (edit/delete)
   - `/tokens/usage` – usage logs page with filters (provider dropdown, date range picker, process name search)

5. Update existing AI/Medusa client code to:
   - Retrieve active tokens from `api_tokens` table
   - Log usage via `log-usage.ts` after each API call

### **Testing & Validation**

- Add token via UI → token encrypted and saved in DB.
- List tokens → masked values displayed, active status shown.
- Filter usage logs by provider and date → correct results.
- After AI enrich call → usage log entry created with process_name and details.
- Token expiry check works correctly.

**Once validated → proceed to Step 11.**

---

## **Step 11 – Enhanced Settings & Medusa Store Connection**

**Goal:** Complete settings page with Medusa store connection, token management integration, and global preferences.

### **Tasks**

1. Update `/settings` page with sections:
   - **Medusa Store Connection**: form fields for `MEDUSA_ADMIN_URL` and `MEDUSA_ADMIN_TOKEN` (save to `settings` table)
   - **Token Management**: embedded token list (link to `/tokens` page) with quick add form
   - **Global Preferences**: FX base currency, default margin %, locale settings
   - **Role-based visibility**: only `owner` role can edit settings

2. Create API route: `POST /api/settings` – save/update settings (validate role: owner only).

3. Create settings helper: `lib/settings/get-settings.ts` – retrieve settings from DB with caching.

4. Update Medusa client to use settings-stored URL and token instead of env vars.

### **Testing & Validation**

- Owner role can edit settings → saved to DB.
- Non-owner roles see read-only or redirect.
- Medusa client uses settings values after save.
- Settings persist across app restarts.

**Once validated → proceed to Step 12.**

---

## **Step 12 – Medusa Sync Module (Bidirectional)**

**Goal:** Implement Medusa store synchronization: fetch products/categories/collections/types/tags/sales_channels from Medusa and support create/update/delete operations.

### **Tasks**

1. Create Medusa sync client: `lib/medusa/sync.ts` with functions:
   - `fetchProducts()`, `fetchCategories()`, `fetchCollections()`, `fetchTypes()`, `fetchTags()`, `fetchSalesChannels()`
   - `createProduct()`, `updateProduct()`, `deleteProduct()` (and equivalents for other entities)

2. Create sync job processor: `workers/sync-processor.ts` (BullMQ worker) that:
   - Processes `medusa_sync_jobs` entries
   - Executes fetch/create/update/delete based on job type
   - Updates job status and logs results

3. Create API routes:
   - `POST /api/sync` – create sync job (entity_type, operation, config)
   - `GET /api/sync/jobs` – list sync jobs with status
   - `POST /api/sync/jobs/:id/trigger` – manually trigger sync job

4. Create UI:
   - `/imports` page: add "Medusa Sync" tab with entity selector and operation type (fetch/create/update/delete)
   - `/monitoring` page: add "Sync Jobs" section showing job status, record counts, errors

5. Update imports module to handle `source: 'medusa_sync'` entries.

### **Testing & Validation**

- Configure Medusa sync for categories → job created → fetch executes → categories saved to local structure.
- Trigger manual sync → job runs → status updates to 'done' with record_count.
- View sync jobs in monitoring page → status, counts, logs visible.
- Update operation from draft → Medusa Admin API called → sync job logged.

**Once validated → proceed to Step 13.**

---

## **Step 13 – Price Monitoring Jobs & Rules**

**Goal:** Implement scheduled price monitoring with configurable rules and alerts.

### **Tasks**

1. Create price rules schema and UI: `/settings/price-rules` page:
   - List price rules (target_margin_pct, min_margin_pct, rounding_rule, currency_preference, active)
   - Create/edit/delete price rules
   - API routes: `GET /api/price-rules`, `POST /api/price-rules`, `PUT /api/price-rules/:id`, `DELETE /api/price-rules/:id`

2. Create monitoring worker: `workers/monitoring.ts` (BullMQ):
   - Daily job (08:00) to compute margin for each published draft/product
   - Compare against active `price_rules`
   - Create `price_checks` entries with delta calculation
   - Generate alerts if delta > threshold

3. Update `/monitoring` page:
   - Display price alerts: product, current margin, delta %, status (new, reviewed, resolved)
   - Filter by status, date range
   - Action buttons: mark as reviewed, resolve

4. Create FX conversion service: `lib/fx/converter.ts`:
   - Fetch rates from exchangerate.host (or configured provider)
   - Cache in Redis (hourly update job)
   - Convert cost currencies to target currency

5. Integrate FX converter into price calculator component.

### **Testing & Validation**

- Create price rule → saved in DB, active status respected.
- Run monitoring job manually → margin computed → price_checks created → alerts generated if threshold exceeded.
- Monitoring page shows alerts → status updates work.
- FX conversion calculates correct prices for different currencies.

**Once validated → proceed to Step 14.**

---

## **Step 14 – Research Page (AI Console)**

**Goal:** Build AI-powered research console for trends and supplier discovery.

### **Tasks**

1. Create `/research` page with sections:
   - **Trends Analysis**: input product category/keyword → AI analyzes trends, suggests tags/keywords
   - **Supplier Finder**: search criteria → AI suggests suppliers with matching profiles
   - **Product Research**: input competitor product → AI extracts specs, pricing, features

2. Create API routes:
   - `POST /api/research/trends` – analyze trends for given keywords
   - `POST /api/research/suppliers` – find suppliers matching criteria
   - `POST /api/research/product` – research competitor product

3. Integrate with token management: log usage for each research API call.

4. Display results in UI with copy-to-draft functionality.

### **Testing & Validation**

- Enter keyword in trends → AI returns analysis → results displayed.
- Search suppliers → AI suggests matches → results link to supplier pages.
- Research product → specs extracted → can create draft from result.
- Usage logged for each research operation.

**Once validated → proceed to Step 15.**

---

## **Step 15 – Documentation Suite**

**Goal:** Create comprehensive documentation for users, developers, and AI agents.

### **Tasks**

1. Create documentation files in `docs/`:
   - `user-guide.md` – end-user guide: how to import, enrich, publish, sync, manage suppliers, use research
   - `developer-guide.md` – code structure, conventions, folder layout, architecture decisions
   - `contributor-guide.md` – coding standards, commit/branch policy, testing requirements, PR process
   - `ai-agent-instructions.md` – step-by-step rules for Cursor/Claude agents, file placement, testing flows

2. Create `docs/design-system.md` – design tokens: colors, typography, spacing, component usage.

3. Create `docs/README.md` with table of contents linking to all documentation.

4. Optionally create `/docs` route in app to view documentation (or link to file system).

### **Testing & Validation**

- All documentation files exist with proper markdown structure.
- README links to all docs.
- Documentation is complete, accurate, and follows consistent format.
- AI agent instructions clearly define rules and constraints.

**Once validated → proceed to Step 16.**

---

## **Step 16 – Enhanced Role System & Audit Logs**

**Goal:** Implement role-based access control and audit logging for sensitive operations.

### **Tasks**

1. Update auth middleware to enforce roles:
   - `owner`: full access including settings, token management, audit logs
   - `manager`: can publish, sync, manage drafts, view monitoring
   - `editor`: can create/edit drafts, use AI enrich, view suppliers
   - `viewer`: read-only access to drafts, suppliers, monitoring

2. Create audit logging helper: `lib/audit/log-action.ts`:
   - Log publish/sync, token management, settings changes, role changes
   - Store in `audit_logs` table with actor_id, action, target_table, target_id, diff_jsonb

3. Create audit logs UI: `/settings/audit-logs` (owner only):
   - List audit entries with filters (actor, action, date range, target)
   - Show diff for update operations

4. Update all sensitive operations to call audit logger.

### **Testing & Validation**

- Viewer role attempts to edit draft → access denied.
- Owner publishes product → audit log entry created with diff.
- Settings change → logged with before/after values.
- Audit logs page shows entries correctly filtered.

**Once validated → proceed to Step 17.**

---

## **Step 17 – Token Usage Dashboard Widget & Analytics**

**Goal:** Add token usage analytics to dashboard and enhance monitoring.

### **Tasks**

1. Create dashboard widget: `components/dashboard/token-usage-widget.tsx`:
   - Chart showing token usage by provider (last 7 days)
   - Total usage count, most used provider, cost estimation (if applicable)

2. Update dashboard page to include token usage widget alongside existing KPIs.

3. Create analytics API: `GET /api/tokens/analytics`:
   - Aggregate usage by provider, date range
   - Return statistics: total calls, unique processes, peak usage times

4. Add export functionality to `/tokens/usage` page: export CSV of usage logs.

### **Testing & Validation**

- Dashboard displays token usage chart with last 7 days data.
- Analytics API returns correct aggregated statistics.
- Export CSV functionality works with filters applied.
- Widget updates when new usage logs are created.

**Once validated → proceed to Step 18.**

---

## **Step 18 – Final QA, Build & Deployment**

**Goal:** Finalize QA, prepare Docker Compose deployment, and verify all features.

### **Tasks**

1. Run comprehensive validation checklist:
   - Test all import flows (CSV, URL, Medusa sync)
   - Verify AI enrichment works with token management
   - Test publish and sync operations to Medusa
   - Verify price monitoring jobs run correctly
   - Test role-based access control
   - Verify token usage logging across all operations
   - Test FX conversion in price calculator
   - Verify research page functionality

2. Create `docker-compose.yml` in root:
   - Web service (Next.js app)
   - Database service (Postgres)
   - Redis service (for BullMQ)
   - Worker service (BullMQ worker processes)

3. Create `docs/deployment.md`:
   - Development setup instructions
   - Production deployment guide
   - Environment variables reference
   - Migration procedures
   - Backup and restore procedures
   - Medusa store connection guide
   - Monitoring and maintenance

4. Create `.dockerignore` and update `.gitignore` if needed.

5. Final code review: ensure all TODOs resolved, error handling in place, types are correct.

### **Testing & Validation**

- All validation checklist items pass.
- `docker-compose.yml` validates without syntax errors (agent does not run docker-compose).
- `deployment.md` contains complete instructions.
- All UI pages accessible and functional.
- Full workflow test: import → enrich → publish → monitor → sync works end-to-end.

**Once done → Hand off to user for final review and production launch.**

---

## **🔄 Coding Consistency & Agent Behavior Rules (Reminder)**

- Each step must be executed **in order**; do not skip.
- Place files only within the correct directory (see Step 0 structure).
- Use Windows-compatible operations; do **not** chain shell commands with `&&`.
- Agents must **not** run or commit `npm install`, `npm run dev`, `build`, `delete` commands without user explicit permission.
- Create unit tests for all pure logic functions (especially token usage, price calc, FX conversion).
- Write commit messages: `feat(step-X): description` or `fix(step-X): description`.
- After each step, output: files created/modified, summary of tests, any blockers.
- Wait for user approval before moving to next step.
- Mark completed steps clearly to avoid confusion.

---

## **📋 Quick Reference**

**Current Step:** Step 9 (Database Schema Extensions)

**Next Steps:**
1. Step 9: Database Schema Extensions (v2 Tables)
2. Step 10: Token Management System
3. Step 11: Enhanced Settings & Medusa Store Connection
4. Step 12: Medusa Sync Module (Bidirectional)
5. Step 13: Price Monitoring Jobs & Rules
6. Step 14: Research Page (AI Console)
7. Step 15: Documentation Suite
8. Step 16: Enhanced Role System & Audit Logs
9. Step 17: Token Usage Dashboard Widget & Analytics
10. Step 18: Final QA, Build & Deployment

**For reference:** See [prd_v2.md](./prd_v2.md) for complete product requirements.

