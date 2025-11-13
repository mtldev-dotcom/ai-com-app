# Project Owner Guide – Nick a Deal / AI E-Commerce Management

This document helps you, Nicky, orchestrate the entire workflow across agents, environments, and builds.

## Overview
This project uses the following main documentation files:
1. **[prd_v2.md](./prd_v2.md)** – Product Requirements Document (full blueprint, v2)
2. **[task-v2.md](./task-v2.md)** – Step-by-step build tasks for AI agents (current plan)
3. **[rules.md](./rules.md)** – Coding & behavior rules for agents
4. **[guide.md](./guide.md)** – You are here (owner control guide)
5. **[README.md](./README.md)** – Documentation index and navigation

## Current Project Status

**✅ Completed Steps (0-15):**
- Step 0: Project Scaffold & Ruleset
- Step 1: Database & ORM Setup
- Step 2: Auth & User Session
- Step 3: Dashboard Layout & Navigation
- Step 4: Imports Module (CSV/URL)
- Step 5: AI Enrichment Functions
- Step 6: Draft Management UI
- Step 7: Medusa Admin API Integration
- Step 8: Supplier Management
- Step 9: Database Schema Extensions (v2 Tables)
- Step 10: Token Management System
- Step 11: Enhanced Settings & Medusa Store Connection
- Step 12: Medusa Sync Module (Bidirectional)
- Step 13: Price Monitoring Jobs & Rules
- Step 14: Research Page (AI Console)
- Step 15: Documentation Suite

**⏳ Next Steps (16-18):**
Continue with **task-v2.md** → Step 16 (Enhanced Role System & Audit Logs)

## Development Flow
1. Review **[task-v2.md](./task-v2.md)** → Identify current step (Step 9)
2. Use Cursor or Claude Code to perform that step only.
3. After completion, validate using the Testing Flow checklist in the task plan.
4. Approve before moving to next step.
5. Repeat until all steps complete.

## Folder Structure
```
AI-Ecommerce-Management/
├── docs/
│   ├── README.md           # Documentation index
│   ├── prd_v2.md           # Current PRD
│   ├── task-v2.md          # Current task plan
│   ├── guide.md            # This file (owner guide)
│   ├── rules.md            # Coding rules
│   ├── reference/          # Reference documentation
│   │   ├── medusa-API-doc.md
│   │   ├── s3-integration-guide.md
│   │   └── ...
│   └── archive/            # Historical documents
│       └── ...
│
├── .dev/
│   └── (ignored workspace for temporary files)
│
└── ai-com-app/
    └── (Next.js 15 project lives here)
```

## Important Notes
- Never let agents run install/build/dev commands without your approval.
- Keep Windows compatibility in mind for all commands (no `&&` chaining).
- Regularly back up `.env` and `docs/` folder.
- Review commits for clarity (`feat(step-X): description`).
- Agents must follow **[rules.md](./rules.md)** strictly.
- Only work on the current step from **[task-v2.md](./task-v2.md)**.

## Working with AI Agents

### For Current Development (Steps 16-18)
1. Reference **[task-v2.md](./task-v2.md)** for the active step
2. Ensure agent reads **[rules.md](./rules.md)** and **[ai-agent-instructions.md](./ai-agent-instructions.md)** before starting
3. Verify each step's Testing & Validation Flow before approval
4. Check that files are placed in correct directories
5. Ensure Windows-compatible commands only

### Step-by-Step Approval Process
1. Agent reads task plan for current step
2. Agent implements only that step's tasks
3. Agent provides summary of changes
4. You validate using Testing Flow checklist
5. Approve before moving to next step

## Documentation Updates

When documentation changes:
- Update **[README.md](./README.md)** if structure changes
- Keep **[guide.md](./guide.md)** (this file) current with project status
- Reference docs go in `reference/` folder
- Historical docs move to `archive/` folder

## Final Tip
Treat this docs bundle as the **governing brain** of your app.  
Cursor, Claude, and any other AI tool should reference it for consistency and safety.

**Current Focus**: Complete Steps 16-18 from **[task-v2.md](./task-v2.md)**.
