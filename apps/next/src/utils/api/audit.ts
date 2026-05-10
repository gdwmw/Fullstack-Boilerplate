import { getApi, ISuccessResponse } from "./base";

interface IAuditLogUser {
  email: null | string;
  id: number;
  imageId: null | number;
  name: null | string;
  phone: null | string;
  role: null | string;
  username: null | string;
}

export interface IAuditLogEntry {
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

export interface IAuditArchiveEntry {
  dateKey: string;
  label: string;
}

export interface IAuditLogMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface IAuditLogListResponse {
  data: IAuditLogEntry[];
  meta: IAuditLogMeta;
}

type TArchiveQueryParams = {
  month?: number;
  year?: number;
};

type TQueryParams = {
  actor?: string;
  archiveDate?: string;
  level?: "ERROR" | "INFO";
  limit?: number;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  page?: number;
  path?: string;
  statusCode?: number;
  time?: string;
};

const label = "audit logs";

export const GETAuditArchives = async (params?: TArchiveQueryParams): Promise<ISuccessResponse<IAuditArchiveEntry[]>> =>
  getApi<IAuditArchiveEntry[]>({
    endpoint: "/audit/archives",
    label: "audit archives",
    params: params,
  });

export const GETAuditLogs = async (params?: TQueryParams): Promise<ISuccessResponse<IAuditLogListResponse>> =>
  getApi<IAuditLogListResponse>({
    endpoint: "/audit",
    label: label,
    params: params,
  });
