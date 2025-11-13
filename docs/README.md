# Nick a Deal – AI Admin Documentation

Welcome to the documentation for the **Nick a Deal – AI Admin** project (also known as **AI E-Commerce Management**). This is a standalone web application for product research, supplier management, catalog organization, and product creation/updates in MedusaJS via the Admin API.

---

## 📚 Documentation Index

### Core Documentation

- **[Product Requirements Document (PRD)](./prd_v2.md)** – Complete product specifications, architecture, data model, and workflows
- **[Task Plan (v2)](./task-v2.md)** – Step-by-step build plan for AI coding agents (Steps 9-18 remaining)
- **[Project Owner Guide](./guide.md)** – Orchestration guide for managing the development workflow
- **[Coding Rules & Agent Instructions](./rules.md)** – Development guidelines, coding standards, and AI agent behavior rules

### User & Developer Documentation

- **[User Guide](./user-guide.md)** – End-user guide: how to use all features (imports, drafts, suppliers, research, etc.)
- **[Developer Guide](./developer-guide.md)** – Code structure, conventions, architecture, and how to extend the application
- **[Contributor Guide](./contributor-guide.md)** – Coding standards, commit policy, testing requirements, and PR process
- **[AI Agent Instructions](./ai-agent-instructions.md)** – Detailed step-by-step rules for Cursor/Claude agents
- **[Design System](./design-system.md)** – Design tokens, colors, typography, spacing, and component usage guidelines

### Reference Documentation

- **[Import Column Mapping Guide](./reference/import-column-guide.md)** – Recommended column naming conventions and perfect table examples for Google Sheets/CSV imports
- **[Medusa API Documentation](./reference/medusa-API-doc.md)** – Medusa Admin API reference and integration guide
- **[S3 Integration Guide](./reference/s3-integration-guide.md)** – AWS S3 storage integration documentation
- **[S3 Integration Summary](./reference/s3-integration-summary.md)** – Quick reference for S3 setup
- **[Medusa Admin OpenAPI Spec](./reference/openapi-medusa-admin.yaml)** – OpenAPI specification for Medusa Admin API
- **[Medusa Store OpenAPI Spec](./reference/openapi-medusa-store.yaml)** – OpenAPI specification for Medusa Store API

### Archived Documents

Historical documents and previous versions are stored in the [`archive/`](./archive/) folder for reference:
- Original PRD (prd.md)
- Previous task plans
- Historical testing guides and fix documentation

---

## 🚀 Quick Start

### Current Project Status

**Completed Steps (0-8):**
- ✅ Step 0: Project Scaffold & Ruleset
- ✅ Step 1: Database & ORM Setup
- ✅ Step 2: Auth & User Session
- ✅ Step 3: Dashboard Layout & Navigation
- ✅ Step 4: Imports Module (CSV/URL)
- ✅ Step 5: AI Enrichment Functions
- ✅ Step 6: Draft Management UI
- ✅ Step 7: Medusa Admin API Integration
- ✅ Step 8: Supplier Management

**Completed Steps (9-14):**
- ✅ Step 9: Database Schema Extensions (v2 Tables)
- ✅ Step 10: Token Management System
- ✅ Step 11: Enhanced Settings & Medusa Store Connection
- ✅ Step 12: Medusa Sync Module (Bidirectional)
- ✅ Step 13: Price Monitoring Jobs & Rules
- ✅ Step 14: Research Page (AI Console)

**Remaining Steps (15-18):**
- ✅ Step 15: Documentation Suite
- ⏳ Step 16: Enhanced Role System & Audit Logs
- ⏳ Step 17: Token Usage Dashboard Widget & Analytics
- ⏳ Step 18: Final QA, Build & Deployment

### For Developers

1. Start with the **[Task Plan](./task-v2.md)** to see what needs to be built next
2. Review **[Coding Rules](./rules.md)** before making any changes
3. Check **[Project Owner Guide](./guide.md)** for workflow orchestration
4. Reference **[PRD](./prd_v2.md)** for complete feature specifications

### For AI Agents (Cursor/Claude)

1. Read **[Coding Rules](./rules.md)** – These are mandatory guidelines
2. Follow **[Task Plan](./task-v2.md)** – Work only on the current step
3. Never skip steps or exceed assigned tasks
4. Wait for user approval before proceeding to the next step

---

## 📁 Documentation Organization

### Structure

```
docs/
├── README.md              # This file (main index)
├── prd_v2.md             # Current PRD
├── task-v2.md             # Current task plan
├── guide.md               # Owner guide
├── rules.md               # Coding rules
│
├── user-guide.md          # End-user guide
├── developer-guide.md     # Developer documentation
├── contributor-guide.md    # Contributor guidelines
├── ai-agent-instructions.md # AI agent instructions
├── design-system.md       # Design system guidelines
│
├── reference/            # Reference documentation
│   ├── medusa-API-doc.md
│   ├── s3-integration-guide.md
│   ├── s3-integration-summary.md
│   ├── openapi-medusa-admin.yaml
│   └── openapi-medusa-store.yaml
│
└── archive/              # Historical documents
    └── (previous versions and historical docs)
```

### File Descriptions

- **README.md** – Main documentation index and navigation
- **prd_v2.md** – Complete product requirements, data model, workflows, and acceptance criteria
- **task-v2.md** – Incremental build plan with tasks and testing flows for each step
- **guide.md** – Project owner's guide for orchestrating development workflow
- **rules.md** – Coding standards, agent behavior rules, and development constraints
- **user-guide.md** – End-user guide covering all application features
- **developer-guide.md** – Code structure, conventions, architecture decisions, and extension guide
- **contributor-guide.md** – Coding standards, commit policy, testing requirements, PR process
- **ai-agent-instructions.md** – Detailed step-by-step instructions for AI coding agents
- **design-system.md** – Design tokens, colors, typography, spacing, component usage

---

## 🔗 Related Resources

- **Repository Root**: `../`
- **Application Code**: `../ai-com-app/`
- **Development Notes**: `../.dev/` (ignored by Git)

---

## 📝 Documentation Maintenance

- All active documentation lives at the root of `docs/`
- Reference materials (API docs, integration guides) are in `reference/`
- Historical/archived documents are in `archive/`
- When updating docs, ensure links in README.md are updated accordingly

---

**Last Updated**: Current as of Steps 0-15 completion. Next milestone: Step 16 (Enhanced Role System & Audit Logs).

