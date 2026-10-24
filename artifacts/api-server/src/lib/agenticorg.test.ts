import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { evaluateWithAgenticOrg } from "./agenticorg";
import type { Lesson, Simulation } from "./lifewise-types";

const previousAgentId = process.env.AGENTICORG_AGENT_ID;
const previousApiKey = process.env.AGENTICORG_API_KEY;
const previousBaseUrl = process.env.AGENTICORG_BASE_URL;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (previousAgentId === undefined) delete process.env.AGENTICORG_AGENT_ID;
  else process.env.AGENTICORG_AGENT_ID = previousAgentId;
  if (previousApiKey === undefined) delete process.env.AGENTICORG_API_KEY;
  else process.env.AGENTICORG_API_KEY = previousApiKey;
  if (previousBaseUrl === undefined) delete process.env.AGENTICORG_BASE_URL;
  else process.env.AGENTICORG_BASE_URL = previousBaseUrl;
  globalThis.fetch = originalFetch;
});

function fixtures() {
  const simulation = {
    id: "sim_test",
    learnerId: "learner_private_id",
    status: "COMPLETED",
    currentStep: 3,
    trackId: "test",
    trackTitle: "Decision scenario",
    impact: 12,
    impactLabel: "illustrative points",
    mastery: 80,
    choices: ["choice_a"],
    track: {
      description: "Practice making a safe decision.",
      steps: [{
        title: "A choice",
        situation: "Contact me at learner@example.com or 9876543210.",
        choices: [
          { id: "choice_a", text: "Choose a safe option." },
          { id: "choice_b", text: "Choose an unsafe option." },
        ],
      }],
    },
  } as unknown as Simulation;
  const lesson = {
    answers: [[{ quality: 80, feedback: "Consider the safer choice.", impact: 12 }, { quality: 10, feedback: "This choice is risky.", impact: -4 }]],
    actions: [],
  } as Lesson;
  return { simulation, lesson };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    run_id: "external-run-123",
    status: "completed",
    confidence: 0.91,
    output: {
      mastery_score: 80,
      confidence_score: 0.91,
      decision_summary: ["The selected choice matches the supplied rubric."],
      actions: ["Review the lesson.", "Practice the skill.", "Discuss the choice with a mentor."],
      risk_flags: [],
      requires_mentor_review: true,
    },
    tool_calls: [],
    ...overrides,
  };
}

test("runs the configured AgenticOrg agent with redacted, non-identifying simulation input", async () => {
  process.env.AGENTICORG_AGENT_ID = "11111111-2222-3333-4444-555555555555";
  process.env.AGENTICORG_API_KEY = "  test-only-not-a-real-key  ";
  delete process.env.AGENTICORG_BASE_URL;
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(JSON.stringify(validPayload()), { status: 200 });
  };

  const { simulation, lesson } = fixtures();
  const result = await evaluateWithAgenticOrg(simulation, lesson);
  assert.equal(requestUrl, "https://app.agenticorg.ai/api/v1/agents/11111111-2222-3333-4444-555555555555/run");
  assert.equal(new Headers(requestInit?.headers).get("authorization"), "Bearer test-only-not-a-real-key");
  const body = JSON.parse(String(requestInit?.body)) as Record<string, any>;
  assert.equal(body.action, "process");
  assert.equal(body.inputs.learner_choices[0].situation.includes("learner@example.com"), false);
  assert.equal(body.inputs.learner_choices[0].situation.includes("9876543210"), false);
  assert.equal(JSON.stringify(body).includes("learner_private_id"), false);
  assert.equal(result.externalRunId, "external-run-123");
  assert.equal(result.mastery, 80);
  assert.equal(result.actions.length, 3);
});

test("rejects an AgenticOrg output that does not preserve mentor review", async () => {
  process.env.AGENTICORG_AGENT_ID = "11111111-2222-3333-4444-555555555555";
  process.env.AGENTICORG_API_KEY = "test-only-not-a-real-key";
  globalThis.fetch = async () => new Response(JSON.stringify(validPayload({
    output: { ...(validPayload().output as object), requires_mentor_review: false },
  })), { status: 200 });
  const { simulation, lesson } = fixtures();
  await assert.rejects(
    evaluateWithAgenticOrg(simulation, lesson),
    (error: unknown) => error instanceof Error && error.message.includes("did not match the Lifewise coaching format"),
  );
});

test("returns a clear scope error without leaking the provider response", async () => {
  process.env.AGENTICORG_AGENT_ID = "11111111-2222-3333-4444-555555555555";
  process.env.AGENTICORG_API_KEY = "test-only-not-a-real-key";
  globalThis.fetch = async () => new Response("sensitive-provider-detail", { status: 403 });
  const { simulation, lesson } = fixtures();
  await assert.rejects(
    evaluateWithAgenticOrg(simulation, lesson),
    (error: unknown) => error instanceof Error &&
      error.message.includes("agents:run or agents:write") &&
      !error.message.includes("sensitive-provider-detail"),
  );
});

test("distinguishes a rejected key from missing run permission without exposing the response", async () => {
  process.env.AGENTICORG_AGENT_ID = "11111111-2222-3333-4444-555555555555";
  process.env.AGENTICORG_API_KEY = "test-only-not-a-real-key";
  globalThis.fetch = async () => new Response("sensitive-provider-detail", { status: 401 });
  const { simulation, lesson } = fixtures();
  await assert.rejects(
    evaluateWithAgenticOrg(simulation, lesson),
    (error: unknown) => error instanceof Error &&
      error.message.includes("401 Unauthorized") &&
      error.message.includes("same AgenticOrg website") &&
      !error.message.includes("agents:run") &&
      !error.message.includes("sensitive-provider-detail"),
  );
});
