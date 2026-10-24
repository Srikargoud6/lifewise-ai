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
import { agenticOrgReady, evaluateWithAgenticOrg } from "../lib/agenticorg";
import {
  browser, getRecord, getRecords, insertRecord, saveRecord, now, uid,
  requireLearner, ownedSimulation, HttpError, publicName, publicRun,
} from "../lib/lifewise-store";
import type { AgentRun, Audit, Learner, Payment, Simulation, Lesson } from "../lib/lifewise-types";

const router: IRouter = Router();
type AgentRunReservation = { status: "RUNNING" | "FAILED" | "COMPLETED"; startedAt: string };
const reservationIdFor = (simulationId: string) => `agent_run_lock_${simulationId}`;

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
  const reservationId = reservationIdFor(sim.id);
  const claimed = await db.transaction(async (tx) => {
    const existing = await getRecord<AgentRun>(id, tx, true);
    if (existing) return { run: existing.data };
    const reservation = await getRecord<AgentRunReservation>(reservationId, tx, true);
    if (reservation && reservation.owner !== owner) throw new HttpError(404, "Simulation not found.");
    const isFreshRun = reservation?.data.status === "RUNNING" &&
      Date.now() - Date.parse(reservation.data.startedAt) < 120_000;
    if (isFreshRun) throw new HttpError(409, "AgenticOrg is already evaluating this simulation. Refresh shortly.");
    const nextReservation: AgentRunReservation = { status: "RUNNING", startedAt: now() };
    if (reservation) {
      await saveRecord(reservationId, nextReservation, tx);
    } else {
      const inserted = await insertRecord(reservationId, "agent_run_reservation", owner, nextReservation, tx);
      if (!inserted.length) throw new HttpError(409, "AgenticOrg is already evaluating this simulation. Refresh shortly.");
    }
    return { claimed: true as const };
  });
  if (claimed.run) { res.json(RunAgentResponse.parse(publicRun(claimed.run))); return; }

  let evaluation;
  try {
    evaluation = await evaluateWithAgenticOrg(sim, lesson);
  } catch (error) {
    await db.transaction(async (tx) => {
      const reservation = await getRecord<AgentRunReservation>(reservationId, tx, true);
      if (reservation?.owner === owner) {
        await saveRecord(reservationId, { status: "FAILED", startedAt: reservation.data.startedAt }, tx);
      }
    });
    throw error;
  }

  const run: AgentRun = {
    id, simulationId: sim.id, learnerName: publicName(sim.learnerId),
    trackTitle: sim.trackTitle,
    agentName: "Lifewise Simulation Coach",
    role: "Life-skills simulation coach",
    provider: "AgenticOrg · live evaluation",
    externalRunId: evaluation.externalRunId,
    toolsCalled: evaluation.toolsCalled,
    reasoningSteps: evaluation.summary,
    actions: evaluation.actions,
    riskFlags: evaluation.riskFlags,
    confidenceScore: evaluation.confidence,
    mastery: evaluation.mastery,
    impact: sim.impact,
    status: "AWAITING_HUMAN_APPROVAL",
    timestamp: now(),
  };
  const saved = await db.transaction(async (tx) => {
    const existing = await getRecord<AgentRun>(id, tx, true);
    if (existing) return existing.data;
    await insertRecord(id, "agent", owner, run, tx);
    await saveRecord(reservationId, { status: "COMPLETED", startedAt: run.timestamp }, tx);
    return run;
  });
  res.json(RunAgentResponse.parse(publicRun(saved)));
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
      agenticOrg: agenticOrgReady() ? "Credentials configured · live runs are user-triggered; connection not yet tested" : "Not connected · live evaluation unavailable",
      pineLabs: "Not connected · test checkout only · no real payments",
      voice: elevenLabsReady() ? "ElevenLabs AI voice · device fallback available" : "Browser SpeechSynthesis · device voice availability varies",
      ai: aiReady() ? "Replit AI Integrations · OpenAI" : "Awaiting phone verification · preloaded curriculum available",
    },
  }));
});

export default router;
