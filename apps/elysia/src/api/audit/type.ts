import { z } from "zod";

import { archiveQuerySchema, querySchema } from "./schema";

export type TQuerySchema = z.infer<typeof querySchema>;
export type TArchiveQuerySchema = z.infer<typeof archiveQuerySchema>;

export interface IArchiveEntry {
  dateKey: string;
  label: string;
}

interface IAuditLogUser {
  email: null | string;
  name: null | string;
  phone: null | string;
  role: null | string;
  username: null | string;
}

export interface ILogEntry {
  durationMs: number;
  error?: string;
  ip: string;
  level: "ERROR" | "INFO";
  method: string;
  path: string;
  payload?: null | Record<string, unknown>;
  requestId: string;
  statusCode: number;
  ts: string;
  userAgent: string;
  users?: IAuditLogUser | null;
}
