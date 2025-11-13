# **Nick a Deal – AI Admin (v2)**

*A standalone web application for product research, supplier management, catalog organization, and product creation/updates in MedusaJS via the Admin API.*

---

## **1\) Product Vision & Goals**

**Audience:** Solo founders and small e-commerce teams running a MedusaJS store, who need faster product research, bilingual content, supplier tracking, and one-click publish \+ sync capabilities.  
 **North Star Metric:** Time-to-publish / time-to-sync for a high-quality, bilingual product from import → enriched draft → Medusa publish or sync.

**Primary Goals (expanded):**

1. Reduce manual data entry (CSV/URL import, smart mapping, normalization).

2. Increase listing quality (AI specs extraction, SEO tags, FR/EN descriptions).

3. Improve margin control (currency FX, target margins, price checks).

4. De-risk suppliers (scoring, lead times, geo coverage, reliability).

5. **Synchronize existing store data** (products, categories, collections, sales channels, types, tags) into this admin tool for full lifecycle: create, update, delete.

6. **Token & process governance**: per-provider token management, usage history (by provider, by date).

7. **Comprehensive documentation** covering End-User Guide, Developer/Contributor Guide (coding consistency, AI agent instructions).

8. **User settings**: Connect Medusa store(s), manage configuration.

**Non-Goals (v1/v2):** Full storefront (customer-facing), order/fulfillment UI, multi-tenant beyond single brand.

---

## **2\) System Architecture**

**Stack (proposed):**

* Frontend: Next.js 15 (App Router) \+ TypeScript \+ Shadcn UI \+ Tailwind \+ i18n (FR/EN)

* Server: Next.js server actions / API routes

* Auth & DB: Supabase (Postgres \+ Auth) or NextAuth \+ Postgres — choose Supabase for speed

* Jobs/Queues: BullMQ \+ Redis (scheduled jobs for price-checks \+ syncs)

* Search/Filters: Postgres full-text; add Meilisearch later if needed

* Storage: Supabase Storage or Cloudflare R2 for imported assets (images, CSVs)

* AI Providers: OpenAI & Google Gemini (with provider fail-over)

* Medusa Integration: Typed client generated from Medusa Admin OpenAPI spec

* FX Rates: exchangerate.host or similar service cached in Redis

* Deployment: Docker Compose (web, db, redis, worker) → DigitalOcean/Railway/other

**High-Level Flow (expanded):**  
 User → App → DB (drafts, suppliers, tokens, imports) → AI Services → Optionally → Medusa Admin API (publish)  
 **\+** Sync Flow: Medusa store → pull into App DB → management UI → Option: push changes → Medusa  
 **\+** Token/Process Logging: track every provider token use and process (timestamped)

---

## **3\) Data Model (Postgres)**

### **Core tables (existing \+ new):**

* `users` `(id, email, name, role, locale, created_at)`

* `suppliers` `(id, name, site_url, contact_email, contact_phone, shipping_regions[], lead_time_days, rating_avg, notes, created_by, created_at, updated_at)`

* `supplier_scores` `(id, supplier_id FK, score_type ENUM['quality','speed','support','price','reliability'], value INT 0-100, rationale, created_by, created_at)`

* `products_draft` `(id, sku, title_en, title_fr, handle, description_en, description_fr, category_ids[], collection_ids[], type_id, tag_ids[], cost_currency, cost_amount, target_margin_pct, suggest_price_currency, suggest_price_amount, images_jsonb, attributes_jsonb, supplier_id FK, supplier_link, status ENUM['draft','ready','published','archived'], medusa_product_id, created_by, created_at, updated_at)`

* `variants_draft` `(id, product_draft_id FK, title_en, title_fr, options_jsonb, barcode, sku, inventory_qty, cost_currency, cost_amount, price_currency, price_amount, compare_at_amount, weight_g, length_cm, width_cm, height_cm)`

* `imports` `(id, source ENUM['csv','url','medusa_sync'], file_path, source_url, mapping_jsonb, imported_count, status ENUM['queued','running','done','error'], log_text, created_by, created_at)`

* `medusa_sync_jobs` `(id, entity_type ENUM['product','category','collection','type','tag','sales_channel'], operation ENUM['fetch','create','update','delete'], status ENUM['queued','running','done','error'], started_at, completed_at, record_count, log_text)`

* `api_tokens` `(id, provider ENUM['openai','gemini','medusa'], token_value_encrypted, created_at, expires_at, active BOOL)`

* `token_usage_logs` `(id, token_id FK, provider ENUM['openai','gemini','medusa'], process_name TEXT, used_at TIMESTAMP, record_count INT, details_jsonb)`

* `price_checks` `(id, product_draft_id FK, supplier_price_amount, supplier_price_currency, selling_price_amount, selling_price_currency, margin_pct, delta_pct, observed_at)`

* `price_rules` `(id, rule_name, target_margin_pct, min_margin_pct, rounding_rule ENUM['.99','.95','none'], currency_preference ENUM['CAD','USD','AUTO'], active BOOL)`

* `images` `(id, product_draft_id FK, src_url, alt_en, alt_fr, width, height, storage_key, sort_order)`

* `audit_logs` `(id, actor_id, action, target_table, target_id, diff_jsonb, created_at)`

* `settings` `(id, key, value_jsonb, created_at, updated_at)`

**Indexes:**

* `products_draft(title_en, title_fr, tag_ids GIN, status)`

* `suppliers(name)`

* `token_usage_logs(token_id, used_at desc)`

* `medusa_sync_jobs(entity_type, status)`

---

## **4\) External Integrations**

### **Medusa Admin API (sync & publish)**

* The App will both **consume** (sync) and **produce** (create/update/delete) data in the Medusa store via Admin API. See documentation: [Medusa Admin API](https://docs.medusajs.com/api/admin#introduction) [docs.medusajs.com+1](https://docs.medusajs.com/api/admin?utm_source=chatgpt.com)

* Entities to sync/manage: products, categories, collections, types, tags, sales channels.

* Example features: categories are nested; a `product` can belong to `product_categories`, `collections`, etc. [docs.medusajs.com+1](https://docs.medusajs.com/v1/modules/products?utm_source=chatgpt.com)

* Sales channels allow specifying different products per channel. [docs.medusajs.com+1](https://docs.medusajs.com/user-guide/settings/sales-channels?utm_source=chatgpt.com)

### **AI Providers**

* Support `openai` and `gemini`, with a pluggable architecture and usage logging.

### **FX Conversion Service**

* External rates API (e.g., exchangerate.host), cached daily in Redis.

---

## **5\) Key Workflows**

### **A) Import / Sync Data**

1. Choose source: CSV upload, URL scrape, or Medusa Sync.

2. Mapping UI (for CSV/URL) or sync config (Medusa).

3. Normalize data: cost currency, images array, metadata.

4. Save to `products_draft` or other sync tables (`categories`, etc).

5. Enqueue AI jobs if applicable.

### **B) Manual Create/Edit Draft**

* UI allows to create directly in the App; auto-fills metadata, suppliers, cost, suggestions.

* One-click AI enrich feature.

### **C) Review → Publish/Sync to Medusa**

* For new entry or updated draft, `publishDraft()` or sync with Medusa via Admin API.

* Link metadata: supplier info, external\_id, source.

* Update `products_draft.status = 'published'` on success.

* For sync jobs: capture create/update/delete operations in `medusa_sync_jobs`.

### **D) Supplier Scoring & Token Usage**

* Enter supplier ratings; average becomes `suppliers.rating_avg`.

* Track every token used: store token logs with provider, process name, date.

### **E) Price Monitoring**

* Daily job: compare cost vs selling price → if delta \> threshold, create alert for user.

### **F) Settings**

* User connects their Medusa store: capture store URL \+ Admin token in `settings`.

* Manage provider tokens (AI, Medusa) – UI for adding, deactivating, viewing usage logs.

### **G) Documentation Suite**

* Generate docs in `/docs`:

  * User Guide (how to use the App)

  * Developer / Contributor Guide (code structure, conventions)

  * AI Agent Instructions (for Cursor/Claude agents)

---

## **6\) Pages & UI (MVP \+ v2)**

* `/login` – Auth

* `/dashboard` – KPIs: drafts ready, avg margin, sync status, token usage

* `/research` – AI console (trends, supplier finder)

* `/imports` – list \+ create import \+ Medusa sync config

* `/drafts` – table of drafts \+ filters

* `/drafts/[id]` – detail editor (FR/EN tabs, specs, price calc, sync/publish button)

* `/suppliers` – list \+ scoring

* `/tokens` – token management & usage logs

* `/monitoring` – alerts for price/margin \+ sync job status

* `/settings` – connect Medusa store, configure AI/Medusa tokens, global prefs

* `/docs` – documentation viewer or link to docs folder

---

## **7\) API Contracts (App’s own)**

* `POST /api/imports` – starts import or sync job

* `POST /api/imports/:id/map` – save mapping for CSV/URL

* `POST /api/sync` – config \+ trigger Medusa sync

* `POST /api/drafts` – create/update draft

* `POST /api/drafts/:id/publish` – publish to Medusa

* `GET /api/tokens` & `POST /api/tokens` – manage tokens

* `GET /api/tokens/usage` – list token usage logs filtered by provider / date

* `GET /api/settings` / `POST /api/settings` – app settings

---

## **8\) Security & Roles**

* Roles: `owner`, `manager`, `editor`, `viewer`

* Row-Level Security (RLS) prepared for multi-tenant future

* Secrets (AI keys, Medusa admin token) only accessible server-side

* Audit logs on publish/sync, token management

---

## **9\) Background Jobs & Queues**

* **Daily 08:00**: price & margin check job

* **Hourly**: FX rates update

* **Scheduled**: Medusa sync jobs (configurable interval)

* **On-demand**: AI enrich jobs, manual sync trigger

* Queues: `ai_jobs`, `imports`, `sync_jobs`, `monitoring`

---

## **10\) CSV Mapping Template (unchanged)**

…\[as previous\]

---

## **11\) Env & Secrets**

`NEXT_PUBLIC_APP_URL=`  
`DATABASE_URL=`  
`REDIS_URL=`  
`SUPABASE_URL=`  
`SUPABASE_ANON_KEY=`  
`SUPABASE_SERVICE_ROLE_KEY=`  
`MEDUSA_ADMIN_URL=`  
`MEDUSA_ADMIN_TOKEN=`  
`OPENAI_API_KEY=`  
`GEMINI_API_KEY=`  
`FX_PROVIDER_URL=  # e.g., https://api.exchangerate.host/latest`  
`FX_BASE=CAD`

---

## **12\) MVP Acceptance Criteria (v2)**

* Import CSV/URL *or* Medusa sync for products/categories runs successfully.

* Token management UI \+ usage logs by provider/date.

* Publish or sync to Medusa works (create/update/delete).

* Settings page connects to Medusa store and stores token securely.

* Documentation suite is created in `/docs`.

---

## **13\) Milestones**

**M1 – Skeleton \+ Token/Settings (Week 1\)**

* Repo scaffold, auth, UI shell, settings page.

* Token management UI \+ backend.  
   **M2 – Imports \+ Medusa Sync Core (Week 2\)**

* CSV/URL import \+ mapping \+ Medusa sync config.  
   **M3 – AI Enrichment \+ Docs Suite (Week 3\)**

* AI enrich endpoints \+ user/dev/docs build.  
   **M4 – Publish/Sync Integration \+ Monitoring (Week 4\)**

* Implement Medusa Admin API publish/update/delete.

* Daily price monitoring \+ token usage logs.  
   **M5 – Refinements \+ QA/Deployment (Week 5\)**

* Final QA, docs review, Docker compose deployment.

---

## **14\) Open Questions / Considerations**

* Should Medusa sync include incremental updates and deletes?

* How many Medusa stores (multi-store) support?

* How detailed should token usage logs be (per API request, per batch)?

* UI for token expiry/rotation policy.

* Bulk operations vs single object operations.

---

## **15\) Wireframe Notes**

…\[as previous\]
