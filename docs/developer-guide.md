# Developer Guide – Nick a Deal AI Admin

This guide explains the codebase structure, architecture decisions, conventions, and how to extend the application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Code Conventions](#code-conventions)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Server Actions](#server-actions)
8. [AI Integration](#ai-integration)
9. [Medusa Integration](#medusa-integration)
10. [Testing](#testing)

---

## Architecture Overview

### Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **UI**: Shadcn UI components, Tailwind CSS
- **Database**: Supabase (PostgreSQL), Drizzle ORM
- **Authentication**: Supabase Auth
- **AI Providers**: OpenAI, Google Gemini
- **Storage**: Supabase Storage (or S3 compatible)
- **Queue System**: Planned (BullMQ + Redis for background jobs)

### Architecture Pattern

- **Server Components**: Default for data fetching
- **Client Components**: Only when needed (interactivity, hooks)
- **Server Actions**: For mutations and form handling
- **API Routes**: For external integrations and webhooks

---

## Technology Stack

### Core Dependencies

```json
{
  "next": "^15.0.0",
  "react": "^18.3.1",
  "typescript": "^5.5.4",
  "drizzle-orm": "^0.33.0",
  "@supabase/supabase-js": "^2.45.4",
  "openai": "^4.28.0",
  "@google/generative-ai": "^0.21.0",
  "zod": "^3.23.8"
}
```

### Key Libraries

- **Drizzle ORM**: Database schema and migrations
- **Zod**: Runtime type validation
- **Shadcn UI**: Component library
- **Lucide React**: Icons
- **Next Themes**: Theme management (light/dark mode)

---

## Project Structure

```
ai-com-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/            # Server actions
│   │   ├── api/                 # API routes
│   │   └── [pages]/            # Page components
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn UI components
│   │   ├── layout/             # Layout components
│   │   ├── drafts/             # Draft-specific components
│   │   └── imports/            # Import-specific components
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── ai/                 # AI client integrations
│   │   ├── medusa/             # Medusa API client
│   │   ├── tokens/             # Token management
│   │   ├── fx/                 # FX conversion
│   │   └── supabase/           # Supabase client setup
│   │
│   ├── db/                     # Database layer
│   │   ├── schema/             # Drizzle schema definitions
│   │   ├── queries/            # Query helper functions
│   │   └── migrations/         # Migration files
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── schemas.ts          # Zod schemas
│   │   └── db.ts               # Database types
│   │
│   └── workers/                # Background workers (future)
│
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

---

## Code Conventions

### Naming

- **Components**: `PascalCase` (e.g., `PriceCalculator.tsx`)
- **Functions/Hooks**: `camelCase` (e.g., `getActiveToken`)
- **Files**: `kebab-case` for components, `camelCase` for utilities
- **Constants**: `UPPER_SNAKE_CASE`
- **Types**: `PascalCase` (e.g., `ProductDraft`)

### File Organization

- **Server Actions**: One file per domain (e.g., `drafts.ts`, `suppliers.ts`)
- **API Routes**: One file per endpoint (`route.ts` in folder)
- **Components**: Co-located with related pages when possible
- **Shared Components**: In `components/ui/` or domain folders

### Import Paths

Use `@/` alias for `src/`:

```typescript
import { db } from "@/db";
import { Button } from "@/components/ui/button";
import { saveDraft } from "@/app/actions/drafts";
```

### TypeScript

- **Strict mode**: Enabled
- **No `any`**: Use proper types or `unknown`
- **Zod for validation**: All user inputs validated with Zod

### Error Handling

- **Server Actions**: Try/catch with user-friendly error messages
- **API Routes**: Return proper HTTP status codes
- **Client Components**: Display errors in UI, log to console

---

## Database Schema

### Schema Definition

Schemas are defined in `src/db/schema/` using Drizzle ORM:

```typescript
// Example: src/db/schema/products-draft.ts
export const productsDraft = pgTable("products_draft", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  titleEn: text("title_en"),
  // ...
});
```

### Migrations

1. **Generate migration**: `npm run db:generate`
2. **Apply migration**: `npm run db:migrate`
3. **Push to DB** (dev): `npm run db:push`

### Schema Files

- `users.ts` - User accounts and roles
- `suppliers.ts` - Supplier information
- `products-draft.ts` - Product drafts
- `variants-draft.ts` - Product variants
- `api-tokens.ts` - API token storage (encrypted)
- `token-usage-logs.ts` - Token usage tracking
- `settings.ts` - Application settings (JSONB)
- `price-rules.ts` - Price monitoring rules
- `price-checks.ts` - Price check history
- `medusa-sync-jobs.ts` - Sync job tracking
- `audit-logs.ts` - Audit trail
- `images.ts` - Image metadata
- `supplier-scores.ts` - Supplier scoring

---

## API Routes

### Structure

API routes follow Next.js App Router conventions:

```
app/api/
├── ai/
│   ├── enrich/route.ts
│   ├── translate/route.ts
│   └── ...
├── tokens/
│   ├── route.ts          # GET, POST
│   ├── [id]/route.ts    # PUT, DELETE
│   └── usage/route.ts
└── ...
```

### Route Pattern

```typescript
// app/api/tokens/route.ts
export async function GET(request: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Logic
  // Return response
}
```

### Dynamic Routes

In Next.js 15, `params` must be awaited:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## Server Actions

### Structure

Server actions are in `app/actions/`:

- One file per domain (e.g., `drafts.ts`, `suppliers.ts`)
- All actions are async and marked with `"use server"`
- Authentication checked in each action

### Pattern

```typescript
"use server";

export async function saveDraft(id: string | null, data: DraftData) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Validation (Zod)
  const validated = schema.parse(data);

  // 3. Database operation
  // 4. Revalidation (Next.js cache)
  // 5. Return result
}
```

### Revalidation

Use `revalidatePath` after mutations:

```typescript
revalidatePath("/drafts");
revalidatePath(`/drafts/${id}`);
```

---

## AI Integration

### AI Clients

Located in `lib/ai/`:

- `openai-client.ts` - OpenAI integration
- `gemini-client.ts` - Google Gemini integration
- `research.ts` - Research functions
- `enrich.ts` - Product enrichment

### Token Management

- Tokens stored in database (encrypted)
- Retrieved via `getActiveToken(provider)`
- Usage logged via `logTokenUsage()`

### Example Usage

```typescript
import { getOpenAIClient } from "@/lib/ai/openai-client";

const client = await getOpenAIClient();
const completion = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
});
```

---

## Medusa Integration

### Client

Located in `lib/medusa/`:

- `client.ts` - Medusa Admin API client
- `publish.ts` - Product publishing logic
- `sync.ts` - Bidirectional sync
- `process-sync.ts` - Sync job processing

### Connection

Medusa credentials stored in `settings` table:
- `MEDUSA_ADMIN_URL`
- `MEDUSA_ADMIN_TOKEN`

Retrieved via `getSetting()` in `lib/settings/get-settings.ts`.

---

## Testing

### Current State

- Manual testing after each step
- Linting: ESLint + Prettier
- Type checking: TypeScript strict mode

### Future Testing

- Unit tests: Jest/Vitest
- Integration tests: Test API routes and server actions
- E2E tests: Playwright/Cypress

### Running Linters

```bash
npm run lint          # ESLint
npm run format        # Prettier format
npm run format:check  # Prettier check
```

---

## Extending the Application

### Adding a New Page

1. Create `app/[page-name]/page.tsx`
2. Add route to sidebar navigation
3. Create server actions if needed
4. Add API routes if external access required

### Adding a New Feature

1. **Database**: Add schema in `db/schema/`
2. **Migration**: Generate and apply migration
3. **Server Actions**: Add actions in `app/actions/`
4. **UI**: Create components and pages
5. **API Routes**: If needed for external access

### Adding AI Features

1. Create function in `lib/ai/`
2. Use token management (`getActiveToken`, `logTokenUsage`)
3. Add server action wrapper
4. Create UI component

---

## Environment Variables

Required environment variables (`.env.local`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Storage (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=

# Medusa (can be stored in settings instead)
MEDUSA_ADMIN_URL=
MEDUSA_ADMIN_TOKEN=
```

---

## Deployment

### Build

```bash
npm run build
```

### Start Production

```bash
npm start
```

### Docker (Future)

`docker-compose.yml` will be added in Step 18.

---

## Common Patterns

### Form Handling

```typescript
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await saveDraft(id, formData);
    // Success handling
  } catch (error) {
    // Error handling
  } finally {
    setSubmitting(false);
  }
};
```

### Data Fetching

```typescript
// Server Component
export default async function Page() {
  const data = await getAllProductDrafts();
  return <DraftsList drafts={data} />;
}

// Client Component with useEffect
const [drafts, setDrafts] = useState([]);

useEffect(() => {
  getAllProductDraftsAction().then(setDrafts);
}, []);
```

---

**Last Updated**: After Step 14 completion

