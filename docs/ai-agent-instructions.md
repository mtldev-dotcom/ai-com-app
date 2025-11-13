# AI Agent Instructions – Nick a Deal AI Admin

This document provides detailed step-by-step instructions for AI coding agents (Cursor, Claude Code, etc.) working on this project.

---

## Overview

These instructions are **mandatory** for all AI agents. Follow them precisely to ensure code quality and maintainability.

**Key Principles:**
1. **Work one step at a time** - Never skip ahead
2. **Follow existing patterns** - Maintain consistency
3. **Wait for approval** - Don't proceed without user confirmation
4. **Respect file structure** - Place files correctly
5. **Windows compatibility** - All commands must work on Windows

---

## Step-by-Step Workflow

### 1. Review Current Step

**Always start by:**
1. Read `docs/task-v2.md` to identify the current step
2. Review `docs/rules.md` for coding guidelines
3. Check `docs/developer-guide.md` for architecture patterns
4. Understand what needs to be built (scope)

**Never:**
- Skip to later steps
- Add features beyond the current step
- Refactor unrelated code

### 2. Understand Requirements

For each task in the step:
- Read the description carefully
- Identify what files need to be created/modified
- Check existing similar implementations for patterns
- Note any database schema changes needed

### 3. Plan Changes

Before writing code:
1. List files to create
2. List files to modify
3. Note database migrations needed
4. Identify dependencies

**Present plan to user if:**
- Unclear about approach
- Multiple valid solutions exist
- Requires user decision

### 4. Implement Code

Follow these rules:

#### File Placement

```
✅ CORRECT:
- Components: src/components/[domain]/[component].tsx
- Actions: src/app/actions/[domain].ts
- API Routes: src/app/api/[route]/route.ts
- Pages: src/app/[page]/page.tsx
- Schema: src/db/schema/[table].ts

❌ WRONG:
- Creating files at root level
- Placing code in docs/ or .dev/
- Mixing concerns (e.g., API logic in components)
```

#### Code Structure

**Server Actions:**
```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";

export async function actionName(params: Params) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Validation (Zod)
  // 3. Database operation
  // 4. Revalidation
  // 5. Return
}
```

**API Routes:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Auth check
  // Logic
  // Return response
}
```

**Client Components:**
```typescript
"use client";

import { useState, useEffect } from "react";

export default function Component() {
  // Implementation
}
```

#### Naming Conventions

- **Components**: `PascalCase` (e.g., `PriceCalculator`)
- **Functions**: `camelCase` (e.g., `getActiveToken`)
- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utils
- **Constants**: `UPPER_SNAKE_CASE`

#### Import Paths

Always use `@/` alias:
```typescript
import { db } from "@/db";
import { Button } from "@/components/ui/button";
```

Never use relative paths like `../../../`

### 5. Database Changes

If schema changes needed:

1. **Update Schema File**
   - Edit `src/db/schema/[table].ts`
   - Add new fields/tables

2. **Generate Migration**
   ```bash
   npm run db:generate
   ```
   (Don't run, just inform user)

3. **Inform User**
   - Tell user to run migration
   - Note any data migration needed

### 6. Testing

After implementation:
1. Verify code compiles (TypeScript)
2. Check for linting errors
3. Review logic for edge cases
4. Suggest manual testing steps

**Never run tests automatically** - User must approve first.

### 7. Documentation

Update documentation if:
- New features added (update user guide)
- Architecture changed (update developer guide)
- API changed (update API docs)

---

## File Creation Rules

### Never Create

- Files in `docs/` (except when explicitly asked)
- Files in `.dev/` (development notes only)
- Stray files at repository root
- Duplicate files with different names

### Always Verify

Before creating a file:
1. Check if similar file exists
2. Verify correct directory
3. Follow existing naming pattern
4. Check if it should be a new file or modification

---

## Code Patterns to Follow

### Authentication

**Always check authentication in:**
- Server actions
- API routes
- Protected pages

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error("Unauthorized");
  // or return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Error Handling

**Server Actions:**
```typescript
try {
  // Operation
} catch (error) {
  console.error("Operation error:", error);
  throw new Error(
    error instanceof Error ? error.message : "Operation failed"
  );
}
```

**Client Components:**
```typescript
try {
  await action();
  setSuccess("Operation successful");
} catch (error) {
  setError(error instanceof Error ? error.message : "Operation failed");
}
```

### Validation

**Always validate user inputs:**
```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const validated = schema.parse(data);
```

### TypeScript Types

**Use proper types:**
```typescript
// From schema
import type { ProductDraft } from "@/db/schema/products-draft";

// Zod schemas
import type { ProductDraftInput } from "@/types/schemas";
```

---

## Windows Compatibility

### Command Rules

**❌ DON'T:**
```bash
cd docs && mkdir reference  # && not supported in PowerShell
```

**✅ DO:**
```bash
cd docs
mkdir reference
```

Or:
```bash
cd docs; mkdir reference  # ; works in PowerShell
```

### Path Separators

- Use forward slashes in code: `src/app/api/tokens/route.ts`
- Windows handles these correctly
- Never use `\` in file paths in code

---

## Common Mistakes to Avoid

### 1. Skipping Steps

**❌ WRONG:**
- Implementing Step 12 features when on Step 10
- Adding "nice to have" features not in current step

**✅ CORRECT:**
- Work only on current step tasks
- Ask before adding extras

### 2. Wrong File Location

**❌ WRONG:**
```
root/
  component.tsx  # Stray file
docs/
  new-feature.ts  # Code in docs
```

**✅ CORRECT:**
```
src/
  components/
    feature/
      component.tsx
src/
  app/
    actions/
      feature.ts
```

### 3. Breaking Patterns

**❌ WRONG:**
- Different error handling style
- Inconsistent naming
- New import style

**✅ CORRECT:**
- Match existing code patterns
- Follow established conventions
- Review similar files first

### 4. Forgetting Auth Checks

**❌ WRONG:**
```typescript
export async function saveData(data: Data) {
  await db.insert(data);  // No auth check!
}
```

**✅ CORRECT:**
```typescript
export async function saveData(data: Data) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  await db.insert(data);
}
```

---

## Testing Checklist (After Implementation)

Before marking step complete:

- [ ] Code compiles (no TypeScript errors)
- [ ] No linting errors
- [ ] Files in correct locations
- [ ] Follows naming conventions
- [ ] Authentication checks present
- [ ] Input validation with Zod
- [ ] Error handling implemented
- [ ] Matches existing code patterns
- [ ] Documentation updated (if needed)

**Manual Testing** (User performs):
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Edge cases handled
- [ ] UI looks correct

---

## Communication with User

### When to Ask

Ask for clarification if:
- Requirements are unclear
- Multiple valid approaches exist
- User decision needed (e.g., design choice)
- Need permission to proceed to next step

### When to Inform

Inform user when:
- Database migration needed
- Environment variable required
- External service setup needed
- Breaking change introduced

### Response Format

After completing work:

1. **Summary**: What was implemented
2. **Files Created**: List of new files
3. **Files Modified**: List of changed files
4. **Testing Steps**: How to verify
5. **Next Steps**: What comes next (if any)

---

## Step-Specific Instructions

### Database Schema Changes

1. Update schema file
2. Inform user: "Run `npm run db:generate` to create migration"
3. Don't run migration yourself

### API Integration

1. Create API client in `lib/[service]/`
2. Add token management if needed
3. Create server actions wrapper
4. Add error handling

### UI Components

1. Use Shadcn UI components
2. Create reusable components when appropriate
3. Follow existing component patterns
4. Add proper TypeScript types

### Feature Pages

1. Use `DashboardLayout` wrapper
2. Follow existing page structure
3. Add proper loading/error states
4. Link in sidebar if main feature

---

## Emergency Procedures

### If Code Breaks

1. **Stop immediately**
2. **Inform user of error**
3. **Don't try multiple fixes**
4. **Wait for user input**

### If Unclear Requirements

1. **Ask specific questions**
2. **Don't assume**
3. **Provide options if multiple approaches**

### If Stuck

1. **Review similar existing code**
2. **Check documentation**
3. **Ask user for guidance**

---

## Success Criteria

A step is complete when:

✅ All tasks from `task-v2.md` implemented  
✅ Code follows all conventions  
✅ No linting/type errors  
✅ User has tested and approved  
✅ Documentation updated (if needed)  

**Only then** can you proceed to the next step (with user approval).

---

**Remember**: Quality over speed. Follow the rules, maintain consistency, and always wait for user approval before proceeding.

---

**Last Updated**: After Step 14 completion

