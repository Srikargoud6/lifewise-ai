import { createHmac } from "node:crypto";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  RegisterLearnerBody, RegisterLearnerResponse, GetLearnerResponse,
  GetTracksResponse, CreateScenarioBody, CreateScenarioResponse,
  StartSimulationBody, StartSimulationResponse,
  GetSimulationParams, GetSimulationResponse,
  MakeDecisionBody, MakeDecisionParams, MakeDecisionResponse,
  TranslateCoachingBody, TranslateCoachingResponse,
} from "@workspace/api-zod";
import { tracks, lessons } from "../lib/curriculum";
import { generateScenario, translateText } from "../lib/lifewise-ai";
import { browser, getRecord, getRecords, insertRecord, saveRecord, now, uid, requireLearner, ownedSimulation, HttpError } from "../lib/lifewise-store";
import type { Learner, Simulation, Track, Lesson } from "../lib/lifewise-types";

const router: IRouter = Router();

router.get("/tracks", (_req, res) => { res.json(GetTracksResponse.parse(tracks)); });

router.post("/learners", async (req, res): Promise<void> => {
  const input = RegisterLearnerBody.parse(req.body);
  const owner = browser(req, res);
  const contact = input.contact.trim().toLowerCase();
  if (!input.name.trim() || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || /^\+?[\d\s()-]{8,20}$/.test(contact))) {
    throw new HttpError(400, "Please enter your name and a valid email address or phone number.");
  }
  const existing = await getRecords<Learner>("learner", owner);
  if (existing[0]) { res.status(201).json(RegisterLearnerResponse.parse(existing[0])); return; }
  const id = "learner_" + createHmac("sha256", process.env.SESSION_SECRET!).update(contact.replace(/[\s()-]/g, "")).digest("hex").slice(0, 24);
  const learner: Learner = {
    id, name: input.name.trim(), ageGroup: input.ageGroup, language: input.language,
    timestamp: now(), status: "FREE_LEARNER_UNVERIFIED", verified: false,
  };
  const saved = await insertRecord(id, "learner", owner, learner);
  if (!saved.length) throw new HttpError(409, "This contact already has a learner profile in another browser. Use a different contact for a separate demo profile.");
  // Contact is only used for a keyed, one-way deduplication identifier. No raw
  // contact information is stored in public telemetry or application logs.
  res.status(201).json(RegisterLearnerResponse.parse(learner));
});

router.get("/learners/me", async (req, res): Promise<void> => {
  const owner = browser(req, res);
  const [learner] = await getRecords<Learner>("learner", owner);
  res.json(GetLearnerResponse.parse({ learner: learner ?? null, simulations: await getRecords<Simulation>("simulation", owner) }));
});

router.post("/scenarios/custom", async (req, res): Promise<void> => {
  const input = CreateScenarioBody.parse(req.body);
  const owner = browser(req, res);
  await requireLearner(owner);
  const scenario = await generateScenario(input.prompt);
  await insertRecord(scenario.track.id, "custom_track", owner, scenario);
  res.status(201).json(CreateScenarioResponse.parse(scenario.track));
});

router.post("/simulations", async (req, res): Promise<void> => {
  const input = StartSimulationBody.parse(req.body);
  const owner = browser(req, res);
  const learner = await requireLearner(owner);
  let track: Track | undefined = tracks.find((t) => t.id === input.trackId);
  if (!track) {
    const custom = await getRecord<{ track: Track; lesson: Lesson }>(input.trackId);
    if (custom?.owner === owner && input.trackId.startsWith("custom_")) track = custom.data.track;
  }
  if (!track) throw new HttpError(404, "Track not found.");
  const sim: Simulation = {
    id: uid("sim"), learnerId: learner.id, trackId: track.id, trackTitle: track.title, track,
    currentStep: 0, choices: [], mastery: 0, confidence: 0, impact: 0, impactLabel: track.impactLabel,
    status: "IN_PROGRESS", feedback: "", timestamp: now(),
  };
  await insertRecord(sim.id, "simulation", owner, sim);
  res.status(201).json(StartSimulationResponse.parse(sim));
});

router.get("/simulations/:id", async (req, res): Promise<void> => {
  const { id } = GetSimulationParams.parse(req.params);
  res.json(GetSimulationResponse.parse(await ownedSimulation(id, browser(req, res))));
});

router.post("/simulations/:id/decisions", async (req, res): Promise<void> => {
  const { id } = MakeDecisionParams.parse(req.params);
  const input = MakeDecisionBody.parse(req.body);
  const owner = browser(req, res);
  const updated = await db.transaction(async (tx) => {
    const sim = await ownedSimulation(id, owner, tx, true);
    if (sim.status !== "IN_PROGRESS" || sim.currentStep !== input.step) throw new HttpError(409, "This step has already changed. Please reload the current decision.");
    let lesson = lessons[sim.trackId];
    if (!lesson) {
      const custom = await getRecord<{ lesson: Lesson }>(sim.trackId, tx);
      if (custom?.owner === owner) lesson = custom.data.lesson;
    }
    const choiceIndex = sim.track.steps[input.step]?.choices.findIndex((c) => c.id === input.choiceId) ?? -1;
    const outcome = lesson?.answers[input.step]?.[choiceIndex];
    if (!outcome || !lesson) throw new HttpError(400, "Choose a valid answer for this step.");
    const choices = [...sim.choices, input.choiceId];
    const scores = choices.map((c, i) => {
      const ix = sim.track.steps[i]!.choices.findIndex((option) => option.id === c);
      return lesson.answers[i]![ix]!;
    });
    const mastery = Math.round(scores.reduce((n, s) => n + s.quality, 0) / 3);
    const next: Simulation = {
      ...sim, choices, currentStep: choices.length, mastery,
      confidence: Math.min(100, Math.round(choices.length * 15 + mastery * 0.55)),
      impact: sim.impact + outcome.impact,
      feedback: outcome.feedback,
      status: choices.length === 3 ? "COMPLETED" : "IN_PROGRESS",
      ...(choices.length === 3 ? { completedAt: now() } : {}),
    };
    await saveRecord(id, next, tx);
    return next;
  });
  res.json(MakeDecisionResponse.parse(updated));
});

router.post("/coach/translate", async (req, res): Promise<void> => {
  const input = TranslateCoachingBody.parse(req.body);
  await requireLearner(browser(req, res));
  res.json(TranslateCoachingResponse.parse({ text: await translateText(input.text, input.language), language: input.language }));
});

export default router;
