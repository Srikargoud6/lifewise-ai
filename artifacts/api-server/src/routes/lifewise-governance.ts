import { Router, type IRouter } from "express";
import { count, sql } from "drizzle-orm";
import { db, lifewiseRecords } from "@workspace/db";
import {
  RunAgentBody, RunAgentResponse, GetAgentRunsResponse, GetApprovalsResponse,
  ReviewApprovalBody, ReviewApprovalParams, ReviewApprovalResponse,
  CreatePaymentBody, CreatePaymentResponse, VerifyPaymentBody, VerifyPaymentResponse,
  GetProofResponse,
} from "@workspace/api-zod";
import { lessons } from "../lib/curriculum";
import { aiReady } from "../lib/lifewise-ai";
import { elevenLabsReady } from "../lib/elevenlabs";
import {
  browser, getRecord, getRecords, insertRecord, saveRecord, now, uid,
  requireLearner, ownedSimulation, HttpError, publicName, publicRun,
} from "../lib/lifewise-store";
import type { AgentRun, Audit, Learner, Payment, Simulation, Lesson } from "../lib/lifewise-types";

const router: IRouter = Router();
const tools = ["evaluate_simulation_choices", "calculate_real_world_impact", "generate_survival_checklist", "propose_certification_for_hitl"];

router.post("/agent/run", async (req, res): Promise<void> => {
  const input = RunAgentBody.parse(req.body);
  const owner = browser(req, res);
  const sim = await ownedSimulation(input.simulationId, owner);
  if (sim.status !== "COMPLETED" || sim.currentStep !== 3) throw new HttpError(409, "Complete all three decisions before requesting evaluation.");
  const id = `agent_${sim.id}`;
  const prior = await getRecord<AgentRun>(id);
  if (prior) { res.json(RunAgentResponse.parse(publicRun(prior.data))); return; }
  let lesson = lessons[sim.trackId];
  if (!lesson) {
    const custom = await getRecord<{ lesson: Lesson }>(sim.trackId);
    if (custom?.owner === owner) lesson = custom.data.lesson;
  }
  if (!lesson) throw new HttpError(404, "Scenario curriculum not found.");
  const actions = lesson.actions.map((action, i) => {
    const ix = sim.track.steps[i]!.choices.findIndex((c) => c.id === sim.choices[i]);
    return (lesson.answers[i]![ix]!.quality < 100 ? "Revisit this decision with a mentor: " : "") + action;
  });
  const run: AgentRun = {
    id, simulationId: sim.id, learnerName: publicName(sim.learnerId),
    trackTitle: sim.trackTitle,
    agentName: "Chanakya_LifeCoach",
    role: "Chief Life-Skills Evaluator & Personal Action-Plan Architect",
    provider: "LOCAL_DEMO — not an AgenticOrg API run",
    toolsCalled: tools,
    reasoningSteps: [
      `Evaluated ${sim.choices.length} decisions against the scenario's educational rubric; mastery ${sim.mastery}/100.`,
      `Calculated illustrative impact ${sim.impact} (${sim.impactLabel}); this is not evidence of actual savings or a clinical score.`,
      "Prepared three practical follow-up actions, highlighting decisions that need mentor discussion.",
      "Stopped before certification: a separate human demo-review decision is mandatory.",
    ],
    actions, confidenceScore: sim.mastery / 100, mastery: sim.mastery, impact: sim.impact,
    status: "AWAITING_HUMAN_APPROVAL", timestamp: now(),
  };
  // Deterministic primary key makes retries and concurrent completion tabs
  // idempotent without inflating telemetry.
  await insertRecord(id, "agent", owner, run);
  const saved = (await getRecord<AgentRun>(id))!;
  res.json(RunAgentResponse.parse(publicRun(saved.data)));
});

router.get("/agent/runs", async (_req, res): Promise<void> => {
  res.json(GetAgentRunsResponse.parse((await getRecords<AgentRun>("agent")).map(publicRun)));
});

router.get("/approvals", async (_req, res): Promise<void> => {
  res.json(GetApprovalsResponse.parse((await getRecords<AgentRun>("agent")).map(publicRun)));
});

router.post("/approvals/:id", async (req, res): Promise<void> => {
  const { id } = ReviewApprovalParams.parse(req.params);
  const input = ReviewApprovalBody.parse(req.body);
  const reviewerBrowser = browser(req, res);
  if (!input.approver.trim() || (input.action !== "approve" && !input.note?.trim())) throw new HttpError(400, "Enter a reviewer name and a note for a revision or approval with note.");
  const run = await db.transaction(async (tx) => {
    const record = await getRecord<AgentRun>(id, tx, true);
    if (!record || !id.startsWith("agent_")) throw new HttpError(404, "Proposal not found.");
    if (record.data.status !== "AWAITING_HUMAN_APPROVAL") throw new HttpError(409, "This proposal has already been reviewed. Refresh the queue.");
    const timestamp = now();
    const approved = input.action !== "reject";
    const updated: AgentRun = {
      ...record.data,
      status: approved ? "APPROVED_BY_HUMAN" : "REJECTED_REVISION_REQUESTED",
      approver: input.approver.trim(), mentorNote: input.note?.trim() ?? "",
      ...(approved ? { approvedAt: timestamp } : {}),
    };
    const audit: Audit = {
      id: uid("decision"), runId: id, proposal: record.data.trackTitle,
      action: updated.status, approver: input.approver.trim(), note: input.note?.trim() ?? "",
      timestamp,
    };
    await saveRecord(id, updated, tx);
    await insertRecord(audit.id, "audit", reviewerBrowser, audit, tx);
    return updated;
  });
  res.json(ReviewApprovalResponse.parse(publicRun(run)));
});

router.post("/payments/pinelabs/create", async (req, res): Promise<void> => {
  const input = CreatePaymentBody.parse(req.body);
  const owner = browser(req, res);
  const learner = await requireLearner(owner);
  const sim = await ownedSimulation(input.simulationId, owner);
  const run = await getRecord<AgentRun>(`agent_${sim.id}`);
  if (run?.data.status !== "APPROVED_BY_HUMAN") throw new HttpError(409, "A human must approve this action plan before test checkout.");
  const id = `test_order_${sim.id}`;
  const payment: Payment = {
    id, simulationId: sim.id, learnerId: learner.id, amount: 9, currency: "INR",
    mode: "TEST_ONLY", status: "TEST_CREATED", timestamp: now(),
    // Deliberately non-payable: a production UPI URI must come from a connected
    // merchant checkout, never from an unverified demo payment address.
    upiIntent: `lifewise-demo://checkout?order=${id}&am=9.00&cu=INR&test=true`,
  };
  await insertRecord(id, "payment", owner, payment);
  res.status(201).json(CreatePaymentResponse.parse((await getRecord<Payment>(id))!.data));
});

router.post("/payments/pinelabs/verify", async (req, res): Promise<void> => {
  const input = VerifyPaymentBody.parse(req.body);
  const owner = browser(req, res);
  const learner = await requireLearner(owner);
  const payment = await db.transaction(async (tx) => {
    const record = await getRecord<Payment>(input.orderId, tx, true);
    if (!record || record.owner !== owner || record.data.mode !== "TEST_ONLY") throw new HttpError(404, "Test order not found in this browser.");
    if (record.data.status === "TEST_VERIFIED") return record.data;
    const run = await getRecord<AgentRun>(`agent_${record.data.simulationId}`, tx, true);
    if (run?.data.status !== "APPROVED_BY_HUMAN") throw new HttpError(409, "An approved action plan is required.");
    const updated: Payment = {
      ...record.data, status: "TEST_VERIFIED", utr: uid("DEMO_NOT_A_BANK_UTR"),
      verifiedAt: now(),
    };
    await saveRecord(record.id, updated, tx);
    await saveRecord(learner.id, { ...learner, status: "TEST_PRO_MEMBER_NOT_PAID" }, tx);
    return updated;
  });
  res.json(VerifyPaymentResponse.parse(payment));
});

router.get("/proof", async (_req, res): Promise<void> => {
  const [learners, simulations, runs, audits, payments, counts, completed, approved, testPayments] = await Promise.all([
    getRecords<Learner>("learner"), getRecords<Simulation>("simulation"),
    getRecords<AgentRun>("agent"), getRecords<Audit>("audit"), getRecords<Payment>("payment"),
    db.select({ kind: lifewiseRecords.kind, value: count() }).from(lifewiseRecords).groupBy(lifewiseRecords.kind),
    db.select({ value: count() }).from(lifewiseRecords).where(sql`${lifewiseRecords.kind} = 'simulation' AND ${lifewiseRecords.data}->>'status' = 'COMPLETED'`),
    db.select({ value: count() }).from(lifewiseRecords).where(sql`${lifewiseRecords.kind} = 'agent' AND ${lifewiseRecords.data}->>'status' = 'APPROVED_BY_HUMAN'`),
    db.select({ value: count() }).from(lifewiseRecords).where(sql`${lifewiseRecords.kind} = 'payment' AND ${lifewiseRecords.data}->>'status' = 'TEST_VERIFIED'`),
  ]);
  const totals = Object.fromEntries(counts.map((r) => [r.kind, r.value]));
  res.json(GetProofResponse.parse({
    signups: totals.learner ?? 0,
    payingUsers: 0, // No connected merchant; test events can never enter this KPI.
    testPayments: testPayments[0]?.value ?? 0, agentRuns: totals.agent ?? 0,
    approvals: approved[0]?.value ?? 0, completedSimulations: completed[0]?.value ?? 0,
    learners: learners.map((l) => ({ ...l, name: publicName(l.id) })),
    simulations, runs: runs.map(publicRun),
    audits: audits.map((a) => ({ ...a, approver: "Demo mentor" })),
    payments,
    integrations: {
      agenticOrg: "Not connected · local demo evaluator only",
      pineLabs: "Not connected · test checkout only · no real payments",
      voice: elevenLabsReady() ? "ElevenLabs AI voice · device fallback available" : "Browser SpeechSynthesis · device voice availability varies",
      ai: aiReady() ? "Replit AI Integrations · OpenAI" : "Awaiting phone verification · preloaded curriculum available",
    },
  }));
});

export default router;
