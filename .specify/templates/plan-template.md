# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Mobile-first PWA and accessibility**: Identify core mobile journeys, installability and offline
  status behavior, responsive targets, and WCAG 2.2 AA verification.
- **Design-system coherence**: Name the shared tokens/components and cover interaction, loading,
  error, locked, empty, destructive, and reduced-motion states.
- **Privacy and round isolation**: Define the private-data boundary, minimal personal data,
  prediction visibility, deletion/anonymization, per-round isolation, and any time-limited audited
  read-only support-metadata access. Global admins receive no implicit private-round rights.
- **Authorization and RLS**: Map each sensitive operation to server authorization and concrete RLS
  ownership/membership/admin predicates; include views, functions, storage, keys, and allow/deny
  tests. The server is authoritative for time and deadlines.
- **Deterministic domain rules**: Define the pure 4/3/2/0 scoring contract, atomic recalculation,
  audit history, and reproducible ranking behavior.
- **Roles and central data**: Preserve exactly one round owner, no co-admin path, and exclusive
  global app-admin control of shared league, fixture, and result data. App-admin status MUST NOT
  permit private-round mutation or access to hidden predictions or member e-mail addresses.
- **Product boundary**: Exclude real-money, betting terminology/patterns, and other explicit PRD
  non-goals.
- **Clean-room and type safety**: Confirm no legacy code, models, or migrations are reused; require
  fresh migrations and TypeScript strict without unjustified suppressions.
- **Test evidence**: Plan mandatory unit, integration/contract, RLS, end-to-end, accessibility, and
  PWA coverage with deterministic CI execution.
- **Operational safety**: Treat Supabase cleanup, schema changes, production identity provisioning,
  production test-data creation/deletion, and deployment as separately and explicitly authorized
  tasks. Each approval names identities, data scope, purpose, cleanup, backup/rollback, and
  verification.

Any failed gate MUST be recorded in Complexity Tracking with project-owner approval and a removal
plan. Non-waivable constitutional rules require an amendment instead of an exception.

## Skills & MCPs

<!--
  Replace this placeholder during planning with exactly one current capability record. List only
  skills and tools selected for this feature; do not treat selection as proof a tool was used.
-->

### Selected skills

| Skill | Purpose |
|---|---|
| `[skill-name]` | [Concrete responsibility in this feature] |

### Selected tools and connectors

| Tool or connector | Purpose | Status |
|---|---|---|
| `[tool-name]` | [Concrete responsibility in this feature] | [Available/Unavailable/Not required] |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
