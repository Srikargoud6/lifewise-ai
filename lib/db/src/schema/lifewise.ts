import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// A single document model keeps the demo's timestamped event types extensible.
// All workflow transitions are committed inside database transactions.
export const lifewiseRecords = pgTable("lifewise_records", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  owner: text("owner").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("lifewise_kind_idx").on(t.kind),
  index("lifewise_owner_idx").on(t.owner),
]);

export const insertLifewiseRecordSchema = createInsertSchema(lifewiseRecords).omit({ createdAt: true });
export type LifewiseRecord = typeof lifewiseRecords.$inferSelect;
export type InsertLifewiseRecord = z.infer<typeof insertLifewiseRecordSchema>;
