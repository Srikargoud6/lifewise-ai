import { z } from "zod/v4";
import { HttpError } from "./lifewise-store";
import type { Lesson, Simulation } from "./lifewise-types";

const DEFAULT_BASE_URL = "https://app.agenticorg.ai";
const MAX_AGENT_RESPONSE_LENGTH = 128_000;

const coachingOutputSchema = z.object({
  mastery_score: z.number().int().min(0).max(100),
  confidence_score: z.number().min(0).max(1),
  decision_summary: z.array(z.string().trim().min(1).max(500)).min(1).max(4),
  actions: z.array(z.string().trim().min(1).max(600)).length(3),
  risk_flags: z.array(z.string().trim().min(1).max(500)).max(6),
  requires_mentor_review: z.literal(true),
});

export type AgenticOrgEvaluation = {
  externalRunId: string;
  confidence: number;
  mastery: number;
  summary: string[];
  actions: string[];
  riskFlags: string[];
  toolsCalled: string[];
};

function redactIdentifiers(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]")
    .replace(/\b(?:\+?\d[\s().-]?){10,13}\b/g, "[redacted number]")
    .replace(/\b\d{12,}\b/g, "[redacted number]")
    .slice(0, 1200);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function parseOutput(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "string") {
    try { return asRecord(JSON.parse(value)); }
    catch { return undefined; }
  }
  return asRecord(value);
}

function agentCredentials(): { agentId: string; apiKey: string; baseUrl: string } {
  const agentId = process.env.AGENTICORG_AGENT_ID?.trim();
  const apiKey = process.env.AGENTICORG_API_KEY;
  if (!agentId || !apiKey) throw new HttpError(503, "AgenticOrg is not configured. Add the agent ID and API key in Replit Secrets.");
  if (agentId.length <= 30 || !agentId.includes("-")) {
    throw new HttpError(503, "AGENTICORG_AGENT_ID must be the AgenticOrg agent UUID, not its name or agent type.");
  }
  const baseUrl = process.env.AGENTICORG_BASE_URL?.trim() || DEFAULT_BASE_URL;
  let parsedUrl: URL;
  try { parsedUrl = new URL(baseUrl); }
  catch { throw new HttpError(503, "AGENTICORG_BASE_URL must be a valid HTTPS URL."); }
  if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    throw new HttpError(503, "AgenticOrg must use an HTTPS base URL without embedded credentials.");
  }
  return { agentId, apiKey, baseUrl: parsedUrl.toString().replace(/\/+$/, "") };
}

function getDecisions(simulation: Simulation, lesson: Lesson) {
  return simulation.choices.map((choiceId, index) => {
    const step = simulation.track.steps[index];
    const choiceIndex = step?.choices.findIndex((choice) => choice.id === choiceId) ?? -1;
    const chosen = step?.choices[choiceIndex];
    const answer = lesson.answers[index]?.[choiceIndex];
    if (!step || !chosen || !answer) throw new HttpError(409, "The completed simulation is missing a valid decision.");
    return {
      step: index + 1,
      step_title: redactIdentifiers(step.title),
      situation: redactIdentifiers(step.situation),
      available_choices: step.choices.map((choice) => redactIdentifiers(choice.text)),
      selected_choice: redactIdentifiers(chosen.text),
      server_rubric_score: answer.quality,
      rubric_feedback: redactIdentifiers(answer.feedback),
      illustrative_impact_points: answer.impact,
    };
  });
}

export async function evaluateWithAgenticOrg(simulation: Simulation, lesson: Lesson): Promise<AgenticOrgEvaluation> {
  const { agentId, apiKey, baseUrl } = agentCredentials();
  const url = `${baseUrl}/api/v1/agents/${encodeURIComponent(agentId)}/run`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        action: "process",
        inputs: {
          task: "Review this completed educational life-skills simulation. Follow the configured Lifewise Simulation Coach instructions.",
          scenario: {
            title: redactIdentifiers(simulation.trackTitle),
            description: redactIdentifiers(simulation.track.description),
            impact_label: redactIdentifiers(simulation.impactLabel),
          },
          learner_choices: getDecisions(simulation, lesson),
          server_calculated_mastery_score: simulation.mastery,
          output_requirements: {
            mastery_score: "integer 0-100; report the server-calculated score supplied above",
            confidence_score: "number 0-1",
            decision_summary: "array of 1-4 short, user-facing educational explanations; not private chain-of-thought",
            actions: "exactly 3 practical next steps",
            risk_flags: "array of safety concerns, or empty array",
            requires_mentor_review: true,
          },
        },
        context: {
          application: "Lifewise AI",
          audience: "Indian learners",
          impact_is_illustrative_only: true,
          learner_identity_included: false,
          human_approval_required: true,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new HttpError(503, "AgenticOrg could not be reached. No review was saved; you can retry.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new HttpError(503, "AgenticOrg rejected the key or run permission. Check that it can run agents (agents:run or agents:write).");
  }
  if (response.status === 404) throw new HttpError(503, "AgenticOrg could not find this agent in the configured deployment. Check its ID and base URL.");
  if (response.status === 429) throw new HttpError(429, "AgenticOrg is rate-limited. Please try again later.");
  if (!response.ok) throw new HttpError(502, "AgenticOrg could not complete this evaluation. Review the agent configuration and try again.");

  let payload: Record<string, unknown> | undefined;
  try {
    const raw = await response.text();
    if (raw.length > MAX_AGENT_RESPONSE_LENGTH) throw new Error("Response too large");
    payload = asRecord(JSON.parse(raw));
  } catch {
    throw new HttpError(502, "AgenticOrg returned an invalid evaluation. No review was saved.");
  }
  if (!payload) throw new HttpError(502, "AgenticOrg returned an invalid evaluation. No review was saved.");

  const result = asRecord(payload.result);
  const rawOutput = parseOutput(payload.output ?? result?.output);
  const output = coachingOutputSchema.safeParse(rawOutput);
  if (!output.success) {
    throw new HttpError(502, "AgenticOrg's response did not match the Lifewise coaching format. Review the agent prompt and try again.");
  }

  const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  if (status !== "completed" && status !== "complete" && status !== "success") {
    throw new HttpError(502, "AgenticOrg did not complete the evaluation. No review was saved.");
  }
  const rawRunId = payload.run_id ?? payload.task_id ?? payload.id;
  const externalRunId = typeof rawRunId === "string" && rawRunId.length <= 200 ? rawRunId : "";
  if (!externalRunId) throw new HttpError(502, "AgenticOrg returned no run ID. No review was saved.");
  const confidence = Number(payload.confidence ?? result?.confidence ?? output.data.confidence_score);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new HttpError(502, "AgenticOrg returned an invalid confidence score. No review was saved.");
  }

  const rawTools = Array.isArray(payload.tool_calls) ? payload.tool_calls : [];
  const toolsCalled = rawTools.flatMap((entry) => {
    const tool = asRecord(entry);
    const name = tool?.name ?? tool?.tool_name ?? tool?.tool;
    return typeof name === "string" ? [redactIdentifiers(name).slice(0, 100)] : [];
  }).slice(0, 20);
  const riskFlags = [...output.data.risk_flags];
  if (output.data.mastery_score !== simulation.mastery) {
    riskFlags.push(`AgenticOrg score (${output.data.mastery_score}/100) differs from the server rubric (${simulation.mastery}/100); the server score remains authoritative.`);
  }

  return {
    externalRunId,
    confidence,
    mastery: simulation.mastery,
    summary: output.data.decision_summary.map(redactIdentifiers),
    actions: output.data.actions.map(redactIdentifiers),
    riskFlags,
    toolsCalled,
  };
}

export const agenticOrgReady = () => Boolean(process.env.AGENTICORG_AGENT_ID && process.env.AGENTICORG_API_KEY);
