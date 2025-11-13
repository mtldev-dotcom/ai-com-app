# Nick a Deal – AI Admin: Step‑by‑Step Build Plan (for Cursor / Claude Code Agents)

This file defines **incremental coding prompts** for agents like Cursor AI or Claude Code to follow strictly. Each step builds upon the previous one. Agents **must not go beyond** their assigned step. After each step, a **Testing & Validation Flow** ensures code integrity before proceeding.

---

## 🧱 Step 0 – Project Scaffold & Ruleset

**Goal:** Initialize consistent foundation for the app.

### Tasks

1. Create monorepo or single‑app Next.js 15 project using TypeScript.
2. Configure Shadcn UI + Tailwind CSS.
3. Add ESLint, Prettier, Husky pre‑commit hooks.
4. Add `src/` structure:

   ```
   src/
     app/          # Next.js App Router pages
     components/   # UI + shared components
     lib/          # utils, api clients
     types/        # zod schemas + TS types
     db/           # orm + migrations
     workers/      # BullMQ queues
   ```
5. Add `.env.example` with placeholders.

### Testing & Validation

✅ Run `pnpm dev` → app boots on `/` with Shadcn UI layout.
✅ Verify ESLint + Prettier auto‑format.
✅ Confirm all imports resolve within `@/` alias.

---

## 🧩 Step 1 – Database & ORM Setup

**Goal:** Define schema and connect database.

### Tasks

1. Add **Supabase** or **Postgres** URL in `.env`.
2. Use **Drizzle ORM** (preferred) or Prisma.
3. Implement core tables: `users`, `suppliers`, `products_draft`, `variants_draft`, `imports`.
4. Add migration files & seed demo data.

### Testing & Validation

✅ Run migration → verify tables created.
✅ Run sample query → fetch demo supplier/product.
✅ Supabase dashboard confirms schema alignment.

---

## ⚙️ Step 2 – Auth & User Session

**Goal:** Secure access using Supabase Auth or NextAuth.

### Tasks

1. Create `/login` and `/register` routes.
2. Setup protected routes (middleware) for `/dashboard`, `/drafts`, `/suppliers`.
3. Add context hook `useUser()` for global session.

### Testing & Validation

✅ Register → Login → Redirect to dashboard.
✅ Logout returns to login.
✅ Protected pages require session.

---

## 🧭 Step 3 – Dashboard Layout & Navigation

**Goal:** Build consistent UI shell.

### Tasks

1. Implement Shadcn `Sidebar`, `Topbar`, and `ThemeToggle`.
2. Add routes: `/dashboard`, `/drafts`, `/imports`, `/suppliers`, `/monitoring`, `/settings`.
3. Sidebar icons + active route highlights.

### Testing & Validation

✅ Navigation links work and maintain session.
✅ Responsive design OK.
✅ Theme toggle persists.

---

## 🧾 Step 4 – Imports Module (CSV/URL)

**Goal:** Upload, map, and preview product data.

### Tasks

1. `/imports` page with upload dropzone (CSV, XLSX, URL input).
2. Column Mapper UI: suggest matching fields (title, price, images, etc.).
3. Normalize and save to DB as draft products.

### Testing & Validation

✅ Upload CSV → preview mapped columns.
✅ Draft records appear in DB.
✅ Errors displayed if missing headers.

---

## 🧠 Step 5 – AI Enrichment Functions

**Goal:** Add backend endpoints for product enrichment.

### Tasks

1. Create `/api/ai/enrich` for descriptions, `/api/ai/translate`, `/api/ai/specs`, `/api/ai/seo`.
2. Connect OpenAI + Gemini SDKs via server actions.
3. Use Zod to validate input/output.

### Testing & Validation

✅ Input draft → returns FR/EN titles + specs.
✅ Error handling if API key missing.
✅ Logging works (console or DB table `ai_jobs`).

---

## 📦 Step 6 – Draft Management UI

**Goal:** Manage products before publication.

### Tasks

1. `/drafts` list page (Shadcn table) → filters by status/date/supplier.
2. `/drafts/[id]` page → form with FR/EN tabs, images, specs, price calc.
3. Add save + AI enrich + delete actions.

### Testing & Validation

✅ Draft created/updated → persisted to DB.
✅ Enrich button fills fields.
✅ Price calculator computes correct margin.

---

## 🔗 Step 7 – Medusa Admin API Integration

**Goal:** Publish draft to Medusa.

### Tasks

1. Create `lib/medusa.ts` using OpenAPI‑generated types.
2. Implement `publishDraft(productDraftId)` → creates product + variants.
3. Store returned Medusa IDs.

### Testing & Validation

✅ Click “Publish” → Medusa dashboard shows new product.
✅ API token works from `.env`.
✅ Metadata includes supplier + cost info.

---

## 📊 Step 8 – Supplier Management

**Goal:** Manage supplier profiles & scoring.

### Tasks

1. `/suppliers` page: list + rating columns.
2. `/suppliers/[id]`: edit info, rate (quality/speed/price/support).
3. Aggregate average rating.

### Testing & Validation

✅ Ratings persist.
✅ Linked products show supplier name.
✅ Score average updates automatically.

---

## 💰 Step 9 – Price Monitoring Jobs

**Goal:** Schedule margin + price change alerts.

### Tasks

1. Setup Redis + BullMQ worker (`/workers/monitoring.ts`).
2. Job: recalc margin from supplier cost vs. store price.
3. Alert if delta > 5%.

### Testing & Validation

✅ Worker starts → processes job.
✅ Alert entry saved in DB/log.
✅ Scheduler runs daily.

---

## 🧩 Step 10 – Settings & Configuration

**Goal:** Add configuration management.

### Tasks

1. `/settings` page → manage AI keys, FX source, Medusa token.
2. Persist in encrypted storage or `.env.local` for dev.
3. Add role‑based visibility (owner only).

### Testing & Validation

✅ Updating settings updates DB.
✅ Permissions enforced.
✅ App restarts with correct configs.

---

## ✅ Step 11 – Final QA & Deployment

**Goal:** Verify all core features and deploy.

### Tasks

1. Run all validation flows sequentially.
2. Build Docker Compose with web + db + redis + worker.
3. Deploy via Dokploy/Portainer.

### Testing & Validation

✅ `docker compose up` → all containers healthy.
✅ Medusa sync success.
✅ User login + full workflow (import → enrich → publish → monitor) works.

---

## ⚖️ Coding Consistency Rules (Global)

1. **Do only the assigned step.** No extra features.
2. **Type‑safe always:** use Zod schemas + TS types.
3. **Organize files logically:** components, lib, db, api.
4. **Comment each new function** with JSDoc (purpose, inputs, outputs).
5. **Use async/await cleanly;** no nested promises.
6. **Write unit tests** for pure functions.
7. **Test before continuing:** approve Testing Flow ✅ before next prompt.
8. **Commit messages:** `feat(step-3): dashboard layout`.

---

### 🚀 Next Action

Start with **Step 0 – Project Scaffold & Ruleset**. Once testing flow passes, move sequentially. Do **not** skip steps or merge tasks prematurely.


Refer to **prompts.md** and **rules.md** for implementation sequence and coding constraints.
