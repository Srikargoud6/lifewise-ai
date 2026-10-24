# Lifewise AI

Learn for life. Decide with confidence.

## Product

Mobile-first life-skills learning for Indian school students, college students,
and first-job learners. Eighteen lessons cover finance, economy, health,
politics, government, and ethics, with lesson quizzes, a Daily 5 challenge,
saved XP, daily goals, streaks and 50/100-day digital badges. Five three-decision
simulations provide practical experience. Simulation coaching is available in
English, Hinglish, Hindi, Kannada, Telugu, and Tamil.

## Current delivery and limits

This is a working **hackathon demo, not a production-certified service**.

- Five preloaded scenarios have server-calculated illustrative scores, persistent
  progress, localized coaching, on-demand ElevenLabs speech, and device-voice fallback.
- Name/contact onboarding creates an **unverified browser profile**, not a
  verified identity or a secure user account.
- The learner frontend contains learning, practice, progress and profile
  controls. Legacy review, observatory and proof views are not mounted;
  their old URLs redirect to learning/progress. Simulation results are not
  gated by mentor review or checkout.
- The legacy AgenticOrg adapter and historical records are retained, but its
  routes are not mounted; retired review/payment/proof endpoints return 410.
  The learner frontend does not invoke them. Live authorization
  has not been verified. The configured deployment is
  `https://agenticorg.hackathon.pinelabs.com`. Set `AGENTICORG_BASE_URL` to that
  origin, not the dashboard URL. Agent ID and API key stay in server Secrets.
- Historical ₹9 checkout/payment code is retained but its endpoints are retired;
  the learner UI has no checkout, QR, certificate or download gate.
- AI scenario generation and custom translation use the configured managed
  OpenAI integration. Generated scenarios have strict three-step output
  validation; native-language translations preserve the selected script.
- ElevenLabs voice IDs are loaded from the learner's authenticated provider
  account. Audio is generated on demand from server-owned simulation feedback,
  capped, rate-limited and cached in memory; retries may use provider credits.
  API credentials are read only by the server and never sent to the browser.
- Free simulation results do not require payment. Learning badges are
  non-monetary habit milestones, not accredited certifications.
- XP is server-calculated: first completion of a lesson/daily source earns
  20 XP plus 10 per correct answer. Retakes earn only improvements over the
  saved best score. Simulations do not award XP. Daily goals reset at the
  server's Asia/Kolkata date boundary; lifetime XP does not.

## Run and operate

- `pnpm --filter @workspace/api-server run dev` — managed API workflow.
- `pnpm --filter @workspace/lifewise run dev` — managed web workflow.
- `pnpm run typecheck` — typecheck shared libraries and apps.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API contracts.
- `pnpm --filter @workspace/db run push` — apply development schema changes.
- `pnpm --filter @workspace/api-server run test:learning` — learning unit and
  PostgreSQL integration checks; database fixtures use a disposable schema.
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
- `artifacts/api-server/src/routes/lifewise-governance.ts` — unmounted legacy
  evaluation, approvals, checkout and logs; historical data is preserved.
- `lib/db/src/schema/lifewise.ts` — timestamped workflow documents.
- `artifacts/lifewise/src/pages/` — learning journey, lessons, daily quizzes,
  saved progress and simulation practice.
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

## Learn library, streaks and rewards

- `/learn` is independent of `/` (Simulations). The authored English library
  contains 18 beginner lessons across six distinct subjects. Reading and the
  ordinary quizzes require no AI call or payment. Coaching language remains
  independent; the new lessons are not represented as translated content.
- Published lesson text and answer keys live separately from learner records.
  Only public questions/options are returned before submission. Attempts,
  progress and achievements use the existing PostgreSQL document model; no
  database replacement or new table is required.
- Every attempt is server-graded and owned by the signed browser cookie.
  Registration remains unverified, without secure sign-in or cross-device
  recovery. The cookie expires after 30 days of inactivity and rolls forward
  on use so active learners can reach 100-day milestones.
- A complete lesson quiz or five-question daily submission credits one day,
  regardless of score. Reads never count. PostgreSQL time after acquiring the
  learner lock determines the Asia/Kolkata date. Same-day attempts cannot
  inflate streaks; best streak and awards survive gaps.
- Progress and unique milestone awards are saved atomically with the attempt.
  Retry request IDs replay their original result; changed payloads under an
  existing request ID are rejected. Intentional practice retakes get new IDs.
- Daily assignments are deterministic and versioned. Never change the question
  bank or assignment algorithm for an already-published daily version; introduce
  a new version and retain the old bank if the curriculum changes.
- 50-Day Learning Champion and 100-Day Life Skills Master are non-monetary
  learning-habit badges, not mentor approvals or accredited certifications.
- References were checked on 2026-10-24: ECI voter education, central RTI FAQs,
  RBI financial education/basic banking, NPCI Safety Shield, ICMR-NIN 2024
  dietary guidance, WHO Patient Safety Rights Charter, UNESCO AI ethics and
  the Income Tax Department salaried guide (AY 2026–27). IRDAI's indexed health
  insurance handbook was linked for concepts; its host timed out during the
  check. Actual policies and current jurisdiction/year rules take precedence.
- All historical-streak verification fixtures belong in disposable database
  schemas, never live learner records or public proof counters.

## Before production launch

Add managed authentication and safe profile/account linking across devices.
Audit remaining learner endpoints for production authorization and add student privacy, consent,
retention and support policies. ElevenLabs speech needs the project secret and
may use account credits; the browser device voice remains a fallback.

## Verification performed

Workspace typecheck passed. API and frontend workflows start successfully.
Preloaded-track and proof endpoints respond. Desktop and mobile home pages
were visually checked. No first-build end-to-end browser tests were run.
Live AI scenario generation and translation were checked independently without
adding synthetic learner or payment records to the proof dashboard.

The Learn addition passed workspace typechecks and seven automated learning
checks, including actual PostgreSQL concurrent submissions and milestone awards
in a disposable schema. A focused desktop/phone browser journey verified
registration-to-quiz submission, missing-answer validation, saved reviews after
reload, best-score preservation on retake, stable daily questions, same-day
streak limits and locked rewards. Its temporary browser profile and all owned
test rows were removed afterward. Simulation launch uses the unchanged existing
start endpoint; it was checked in code, not repeated in the browser pass.
