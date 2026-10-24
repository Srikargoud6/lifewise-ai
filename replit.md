# Lifewise AI

The Real-World Survival Simulator for Skills Schools Never Teach.

## Product

Mobile-first educational practice for Indian school students, college students,
and first-job learners. Five three-decision tracks cover finance, economy,
health, politics and civic sense, and ethics. Coaching is available in English,
Hinglish, Hindi, Kannada, Telugu, and Tamil.

## Current delivery and limits

This is a working **hackathon demo, not a production-certified service**.

- Five preloaded scenarios have server-calculated illustrative scores, persistent
  progress, localized coaching, and browser speech playback.
- Name/contact onboarding creates an **unverified browser profile**, not a
  verified identity or a secure user account.
- The mentor console is explicitly public demo review, not authenticated
  role-based access. Do not present these badges as accredited certifications.
- Chanakya_LifeCoach is a local rubric evaluator with public decision summaries
  and an approval stop. It is **not** a connected AgenticOrg execution.
- ₹9 checkout uses a non-payable demonstration QR. Test verification updates
  test-only membership and never contributes to the real-paying-users counter.
- AI scenario generation and custom translation use the configured managed
  OpenAI integration. Generated scenarios have strict three-step output
  validation; native-language translations preserve the selected script.
- Free learner IQ results do not require payment. The demo badge and action kit
  require human approval; download/print additionally require test checkout.
- Proof counters are calculated from actual database rows. No fabricated
  external signups, agent activity, mentor decisions or payments are seeded.

## Run and operate

- `pnpm --filter @workspace/api-server run dev` — managed API workflow.
- `pnpm --filter @workspace/lifewise run dev` — managed web workflow.
- `pnpm run typecheck` — typecheck shared libraries and apps.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API contracts.
- `pnpm --filter @workspace/db run push` — apply development schema changes.
- Use existing artifact-managed workflows; do not configure duplicate services.
- Preview frontend is `/`; shared API is `/api`.

## Stack and source of truth

- React, TypeScript, Vite, Tailwind, Lucide, Wouter, TanStack Query.
- Express 5, PostgreSQL, Drizzle, generated Zod request/response validation.
- `lib/api-spec/openapi.yaml` — contract; regenerate after every change.
- `artifacts/api-server/src/lib/curriculum.ts` — preloaded lessons, scoring,
  action-kit templates and human-authored coaching translations.
- `artifacts/api-server/src/routes/lifewise-learning.ts` — browser learner
  registration, custom scenarios, simulation progression and coaching.
- `artifacts/api-server/src/routes/lifewise-governance.ts` — local evaluation,
  demo approvals, test checkout, redacted proof logs.
- `lib/db/src/schema/lifewise.ts` — timestamped workflow documents.
- `artifacts/lifewise/src/pages/` — learning, simulation, mentor, observatory,
  and proof views.
- `artifacts/lifewise/src/index.css` — visual theme.

## Integrity and privacy decisions

- Learner names are pseudonymized in public telemetry. Raw contacts are not
  stored: a keyed one-way digest deduplicates registrations.
- Avoid collecting personal information in custom dilemmas or mentor notes.
  Free-form educational submissions are not suitable for confidential data.
- Keep test events separate from verified real-world activity. Connecting a
  real provider must not retroactively reclassify old test events.
- Financial/health/civic content is educational, not personalized professional
  advice. Scores and savings are hypothetical; preserve the curriculum caveats.
- Server-owned timestamps, scoring and workflow states must not come from
  client submissions.
- Decision updates and approval audits use transactions; evaluation and payment
  creation use stable unique keys so retries do not inflate counters.

## Before production launch

Add managed authentication and enforce mentor authorization server-side.
Connect and implement real AgenticOrg execution and Pine Labs
merchant checkout using current provider documentation and server-verified
payment status/webhook signatures. Add appropriate student privacy, consent,
retention and support policies. Browser voice playback depends on installed
device voices; it cannot be guaranteed on all browsers.

## Verification performed

Workspace typecheck passed. API and frontend workflows start successfully.
Preloaded-track and proof endpoints respond. Desktop and mobile home pages
were visually checked. No first-build end-to-end browser tests were run.
Live AI scenario generation and translation were checked independently without
adding synthetic learner or payment records to the proof dashboard.
