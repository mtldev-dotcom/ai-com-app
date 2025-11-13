# Contributor Guide – Nick a Deal AI Admin

This guide is for developers contributing to the project. It covers coding standards, commit policies, testing requirements, and the pull request process.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Coding Standards](#coding-standards)
3. [Git Workflow](#git-workflow)
4. [Commit Messages](#commit-messages)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Code Review Guidelines](#code-review-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Git
- PostgreSQL database (or Supabase account)
- Code editor (VS Code recommended)

### Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd AI-Ecommerce-Management
   ```

2. **Install Dependencies**
   ```bash
   cd ai-com-app
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Fill in required environment variables
   - See [Developer Guide](./developer-guide.md) for details

4. **Database Setup**
   ```bash
   npm run db:push     # Push schema to database
   npm run db:seed     # Seed sample data (optional)
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## Coding Standards

### TypeScript

- **Strict mode**: Always enabled
- **No `any`**: Use proper types, `unknown`, or generics
- **Type inference**: Prefer inference where types are obvious
- **Explicit types**: Use for public APIs and complex objects

```typescript
// Good
const user: User = await getUser();
const items = data.items; // Type inferred

// Bad
const user: any = await getUser();
```

### Code Style

- **ESLint**: Follow Next.js ESLint config
- **Prettier**: Auto-format on save
- **Line length**: 100 characters (Prettier default)

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `PriceCalculator.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `getToken.ts`)
- **Pages**: `page.tsx` (Next.js convention)
- **API Routes**: `route.ts` (Next.js convention)

### Import Organization

1. External dependencies
2. Internal absolute imports (`@/`)
3. Relative imports
4. Type imports (with `type` keyword)

```typescript
import { useState } from "react";
import { NextRequest } from "next/server";

import { db } from "@/db";
import { Button } from "@/components/ui/button";

import { localUtil } from "./utils";

import type { User } from "@/types/db";
```

### Component Structure

```typescript
// 1. Imports
// 2. Type definitions
// 3. Component
export default function Component() {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

### Error Handling

- **Server Actions**: Try/catch with user-friendly errors
- **API Routes**: Return proper HTTP status codes
- **Client Components**: Display errors, don't crash

```typescript
try {
  const result = await saveDraft(data);
  return { success: true, data: result };
} catch (error) {
  console.error("Save draft error:", error);
  throw new Error(error instanceof Error ? error.message : "Failed to save");
}
```

---

## Git Workflow

### Branch Naming

- **Feature**: `feat/description` (e.g., `feat/price-monitoring`)
- **Fix**: `fix/description` (e.g., `fix/token-validation`)
- **Refactor**: `refactor/description`
- **Docs**: `docs/description`

### Branch Strategy

1. **Main branch**: `master` (production-ready)
2. **Feature branches**: Create from `master`, merge via PR
3. **Hotfixes**: Create from `master`, merge directly if urgent

### Workflow Steps

1. **Create Branch**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feat/new-feature
   ```

2. **Make Changes**
   - Write code following standards
   - Test locally
   - Commit with clear messages

3. **Push and Create PR**
   ```bash
   git push origin feat/new-feature
   # Create PR via GitHub/GitLab UI
   ```

4. **After Review**
   - Address review feedback
   - Update PR if needed
   - Merge after approval

---

## Commit Messages

### Format

```
type(scope): concise description

Optional longer description if needed.

Closes #issue-number
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, whitespace
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(step-13): implement price monitoring jobs

- Add price rules management UI
- Create FX conversion service
- Update monitoring page with alerts

feat(research): add supplier finder AI feature

fix(drafts): handle empty supplier ID validation

refactor(api): simplify token retrieval logic
```

### Rules

- Use imperative mood ("add" not "added")
- Keep subject line under 72 characters
- Reference issue numbers if applicable
- Be specific about what changed

---

## Testing Requirements

### Current Testing

- **Manual Testing**: Required after each change
- **Linting**: ESLint + Prettier (pre-commit hooks)
- **Type Checking**: TypeScript compiler

### Future Testing (Planned)

- **Unit Tests**: Jest/Vitest for utilities
- **Integration Tests**: API routes and server actions
- **E2E Tests**: Playwright for critical user flows

### Testing Checklist

Before submitting PR:

- [ ] Code compiles without errors
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatting applied
- [ ] Manual testing of changed features
- [ ] No console errors in browser
- [ ] Database migrations tested (if applicable)

### Local Testing

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Type check
npx tsc --noEmit

# Run dev server and test manually
npm run dev
```

---

## Pull Request Process

### PR Checklist

1. **Code Quality**
   - [ ] Follows coding standards
   - [ ] No linting errors
   - [ ] Proper error handling
   - [ ] TypeScript types correct

2. **Functionality**
   - [ ] Feature works as expected
   - [ ] Edge cases handled
   - [ ] No breaking changes (or documented)

3. **Documentation**
   - [ ] Code comments for complex logic
   - [ ] Updated README/docs if needed
   - [ ] API changes documented

4. **Testing**
   - [ ] Manual testing completed
   - [ ] No regressions introduced

### PR Description Template

```markdown
## Description
Brief description of changes

## Changes
- Feature 1
- Feature 2
- Bug fix

## Testing
- Tested scenario 1
- Tested scenario 2

## Screenshots (if UI changes)
[Add screenshots]

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: Linting, type checking (CI/CD)
2. **Code Review**: At least one approval required
3. **Testing**: Reviewer may request additional testing
4. **Merge**: After approval and checks pass

---

## Code Review Guidelines

### For Reviewers

**Focus On:**
- Code correctness and logic
- Security concerns
- Performance implications
- Maintainability
- Test coverage

**Be Constructive:**
- Provide specific suggestions
- Explain why changes are needed
- Offer alternatives if appropriate
- Acknowledge good work

### For Authors

**Responding to Feedback:**
- Address all comments
- Ask for clarification if needed
- Update PR description if scope changes
- Request re-review after changes

---

## Architecture Guidelines

### Adding New Features

1. **Follow Existing Patterns**
   - Use similar structure to existing features
   - Reuse components where possible
   - Follow naming conventions

2. **Database Changes**
   - Create schema in `db/schema/`
   - Generate migration (`npm run db:generate`)
   - Test migration on dev database

3. **API Design**
   - RESTful conventions
   - Proper HTTP methods
   - Consistent error responses

4. **State Management**
   - Server state: Fetch in Server Components
   - Client state: React hooks (useState, useEffect)
   - Form state: Controlled components

---

## Security Guidelines

### Authentication

- Always check authentication in server actions
- Use `createClient()` from Supabase server utils
- Never expose tokens or secrets to client

### Input Validation

- Validate all user inputs with Zod
- Sanitize data before database operations
- Use parameterized queries (Drizzle handles this)

### Token Management

- Tokens encrypted before storage
- Never log token values
- Use environment variables for sensitive config

---

## Performance Guidelines

### Database Queries

- Use indexes for frequently queried fields
- Limit result sets (pagination)
- Avoid N+1 queries (use joins)

### API Calls

- Cache when appropriate (Next.js revalidation)
- Debounce/throttle user interactions
- Optimize payload sizes

### React Performance

- Use Server Components by default
- Client Components only when needed
- Memoize expensive computations
- Avoid unnecessary re-renders

---

## Documentation

### Code Comments

- JSDoc for public functions
- Explain "why" not "what"
- Document complex algorithms

```typescript
/**
 * Get active API token for a provider
 * Returns the first active, non-expired token
 * @param provider - Provider name (openai, gemini, medusa)
 * @returns Decrypted token value or null
 */
export async function getActiveToken(provider: Provider): Promise<string | null> {
  // ...
}
```

### README Updates

- Update README when adding features
- Document new environment variables
- Update setup instructions if needed

---

## Getting Help

- **Questions**: Open a GitHub issue
- **Bugs**: Open a bug report issue
- **Feature Requests**: Open a feature request issue
- **Code Questions**: Ask in PR comments

---

**Last Updated**: After Step 14 completion

