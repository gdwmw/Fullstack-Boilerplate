import { z } from "zod";

import { querySchema } from "./schema";

export type TQuerySchema = z.infer<typeof querySchema>;

export interface ILogEntry {
  durationMs: number;
  error?: string;
  ip: string;
  level: "ERROR" | "INFO";
  method: string;
  path: string;
  requestId: string;
  statusCode: number;
  ts: string;
  userAgent: string;
}
