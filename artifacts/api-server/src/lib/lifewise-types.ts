import { z } from "zod";
import {
  GetTracksResponseItem, GetSimulationResponse, RegisterLearnerResponse,
  RunAgentResponse, CreatePaymentResponse, GetProofResponse,
} from "@workspace/api-zod";

export type Track = z.infer<typeof GetTracksResponseItem>;
export type Simulation = z.infer<typeof GetSimulationResponse>;
export type Learner = z.infer<typeof RegisterLearnerResponse>;
export type AgentRun = z.infer<typeof RunAgentResponse>;
export type Payment = z.infer<typeof CreatePaymentResponse>;
export type Audit = z.infer<typeof GetProofResponse>["audits"][number];
export type Language = "English" | "Hinglish" | "Hindi" | "Kannada" | "Telugu" | "Tamil";
export type Outcome = {
  impact: number;
  quality: number;
  feedback: string;
};
export type Lesson = {
  answers: Outcome[][];
  actions: string[];
};
