import { getApi, ISuccessResponse } from "./base";

interface IAuditLogUser {
  email: null | string;
  id: string;
  imageId: null | string;
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
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface IAuditLogListResponse {
  data: IAuditLogEntry[];
  meta: IAuditLogMeta;
}

interface IArchiveQueryParams {
  month?: number;
  year?: number;
}

interface ILogQueryParams {
  actor?: string;
  archiveDate?: string;
  level?: "ERROR" | "INFO";
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  page?: number;
  pageSize?: number;
  path?: string;
  statusCode?: number;
  timeFrom?: string;
  timeTo?: string;
}

const label = "audit logs";

export const GETAuditArchives = async (params?: IArchiveQueryParams): Promise<ISuccessResponse<IAuditArchiveEntry[]>> =>
  getApi<IAuditArchiveEntry[]>({
    endpoint: "/audit/archives",
    label: "audit archives",
    params: params,
  });

export const GETAuditLogs = async (params?: ILogQueryParams): Promise<ISuccessResponse<IAuditLogListResponse>> =>
  getApi<IAuditLogListResponse>({
    endpoint: "/audit",
    label: label,
    params: params,
  });
