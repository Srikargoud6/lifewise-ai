import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, lifewiseRecords } from "@workspace/db";
import type { Request, Response } from "express";
import type { Learner, Simulation, AgentRun } from "./lifewise-types";

type Executor = Pick<typeof db, "select" | "insert" | "update">;
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const now = () => new Date().toISOString();
export const uid = (prefix: string) => `${prefix}_${randomBytes(12).toString("hex")}`;
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export function browser(req: Request, res: Response): string {
  const prior = req.signedCookies?.lw_browser;
  if (typeof prior === "string" && /^[a-f0-9]{64}$/.test(prior)) return hash(prior);
  const token = randomBytes(32).toString("hex");
  res.cookie("lw_browser", token, {
    signed: true, httpOnly: true, sameSite: "lax",
    secure: req.secure || req.get("x-forwarded-proto") === "https",
    maxAge: 1000 * 60 * 60 * 24 * 30, path: "/",
  });
  return hash(token);
}

export async function getRecord<T>(id: string, tx: Executor = db, locked = false): Promise<{ id: string; owner: string; data: T } | undefined> {
  const q = tx.select().from(lifewiseRecords).where(eq(lifewiseRecords.id, id));
  const [r] = locked ? await q.for("update") : await q;
  return r ? { id: r.id, owner: r.owner, data: r.data as T } : undefined;
}
export async function getRecords<T>(kind: string, owner?: string): Promise<T[]> {
  const where = owner ? and(eq(lifewiseRecords.kind, kind), eq(lifewiseRecords.owner, owner)) : eq(lifewiseRecords.kind, kind);
  const rows = await db.select().from(lifewiseRecords).where(where).orderBy(desc(lifewiseRecords.createdAt)).limit(2000);
  return rows.map((r) => r.data as T);
}
export async function insertRecord<T extends object>(id: string, kind: string, owner: string, data: T, tx: Executor = db) {
  return tx.insert(lifewiseRecords).values({ id, kind, owner, data: data as Record<string, unknown> }).onConflictDoNothing().returning();
}
export async function saveRecord<T extends object>(id: string, data: T, tx: Executor = db) {
  await tx.update(lifewiseRecords).set({ data: data as Record<string, unknown> }).where(eq(lifewiseRecords.id, id));
}
export async function requireLearner(owner: string): Promise<Learner> {
  const [learner] = await getRecords<Learner>("learner", owner);
  if (!learner) throw new HttpError(401, "Create your unverified learner profile before starting.");
  return learner;
}
export async function ownedSimulation(id: string, owner: string, tx: Executor = db, lock = false): Promise<Simulation> {
  const record = await getRecord<Simulation>(id, tx, lock);
  if (!record || record.owner !== owner || !id.startsWith("sim_")) throw new HttpError(404, "Simulation not found in this browser profile.");
  return record.data;
}
export const publicName = (id: string) => `Learner ${id.slice(-6).toUpperCase()}`;
export function publicRun(run: AgentRun): AgentRun {
  return { ...run, approver: run.approver ? "Demo mentor" : undefined };
}
