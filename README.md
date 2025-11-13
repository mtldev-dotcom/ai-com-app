# AI E-Commerce Management

Nick a Deal Admin Tool - Product Management Platform

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Component library
- **ESLint + Prettier** - Code quality and formatting
- **Husky + lint-staged** - Pre-commit hooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm (package manager)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Setup Husky (runs automatically via `prepare` script):

```bash
npm run prepare
```

3. Create environment file:

```bash
# Copy the example and fill in your values
cp .env.example .env.local
```

4. Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Create a `.env.local` file with the following variables (see `.env.example` for template):

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ai_ecommerce

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key-here
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here

# Medusa Admin API
MEDUSA_ADMIN_API_TOKEN=your-medusa-admin-api-token
MEDUSA_BASE_URL=https://your-medusa-instance.com

# Redis (for BullMQ workers)
REDIS_URL=redis://localhost:6379

# FX API - Alpha Vantage (https://www.alphavantage.co/documentation/)
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key-here

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # UI components (Shadcn UI components in ui/)
├── lib/          # Utilities and API clients
├── types/        # TypeScript types and Zod schemas
├── db/           # ORM and migration files
└── workers/      # BullMQ queue workers
```

## Path Aliases

The project uses `@/` alias for imports from the `src/` directory:

```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
```

## Code Quality

- ESLint is configured with Next.js and TypeScript rules
- Prettier handles code formatting
- Husky runs lint-staged on pre-commit to ensure code quality

## Database Setup

This project uses **Drizzle ORM** with **Supabase** (PostgreSQL).

### Database Commands

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:push` - Push schema changes directly to database (development)
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with demo data

### Initial Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your database URL from Supabase dashboard (Settings → Database → Connection string)
3. Add to `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Generate and push migrations:
   ```bash
   npm run db:generate
   npm run db:push
   ```
5. Seed with demo data:
   ```bash
   npm run db:seed
   ```

### Database Schema

- `users` - User accounts
- `suppliers` - Supplier information with ratings
- `products_draft` - Draft products before publication
- `variants_draft` - Product variants (size, color, etc.)
- `imports` - Import job tracking

## Next Steps

See `docs/prd.md` for the complete build plan and next steps.
